import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";

test("PostgreSQL family routine: consent, rollback, child sessions, expiry and pairing", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE TABLE users(id serial PRIMARY KEY, fullname varchar(100) NOT NULL, email varchar(150) UNIQUE NOT NULL,
        passwordhash varchar(255) NOT NULL, avatarstate jsonb DEFAULT '{}', familyrole varchar(30) NOT NULL DEFAULT 'roommate');
      CREATE TABLE householdinfo(id serial PRIMARY KEY, name varchar(100) NOT NULL, adminuserid int NOT NULL REFERENCES users(id));
      CREATE TABLE householdmembers(householdid int REFERENCES householdinfo(id), userid int REFERENCES users(id), role varchar(20) NOT NULL,
        joinedat timestamp DEFAULT (now() AT TIME ZONE 'UTC'), PRIMARY KEY(householdid,userid));
      CREATE TABLE sessions(id serial PRIMARY KEY, userid int NOT NULL REFERENCES users(id), tokenhash varchar(64) UNIQUE NOT NULL,
        createdat timestamp DEFAULT (now() AT TIME ZONE 'UTC'), expiresat timestamp NOT NULL);
      INSERT INTO users(fullname,email,passwordhash) VALUES('Parent','parent@example.invalid','test'),('Other','other@example.invalid','test');
      INSERT INTO householdinfo(name,adminuserid) VALUES('Family',1);
      INSERT INTO householdmembers(householdid,userid,role) VALUES(1,1,'Admin');
      INSERT INTO sessions(userid,tokenhash,expiresat) VALUES(1,'parent-session',(now() AT TIME ZONE 'UTC')+interval '1 day');
    `);
    await db.exec(
      await readFile(
        new URL("../../db/migrations/006_family_access.sql", import.meta.url),
        "utf8",
      ),
    );
    const call = async (action, data) =>
      JSON.parse(
        (
          await db.query("SELECT neondb_stp_family_access($1,$2) AS result", [
            action,
            JSON.stringify(data),
          ])
        ).rows[0].result,
      );
    const invite = (id, hash) =>
      call("invite", { id, hash, caller: 1, household: 1 });
    assert.equal(
      (await call("invite", { caller: 2, household: 1 })).error,
      "forbidden",
    );
    await invite("first", "secret");
    assert.equal(
      (await call("preview", { hash: "secret" })).householdName,
      "Family",
    );
    const joined = await call("join", {
      hash: "secret",
      fullname: "New adult",
      email: "new@example.invalid",
      passwordHash: "test",
      sessionHash: "joined-session",
    });
    assert.equal(joined.householdId, 1);
    assert.equal(
      (await db.query("SELECT count(*)::int AS count FROM householdinfo"))
        .rows[0].count,
      1,
    );
    assert.ok((await call("accept", { caller: 2, hash: "secret" })).error);
    await invite("second", "revoked");
    await call("revoke", { caller: 1, household: 1, id: "second" });
    assert.ok((await call("accept", { caller: 2, hash: "revoked" })).error);
    await invite("third", "expired");
    await db.exec(
      "UPDATE familyinvitations SET expiresat=(now() AT TIME ZONE 'UTC')-interval '1 minute' WHERE id='third'",
    );
    assert.ok((await call("preview", { hash: "expired" })).error);
    await invite("fourth", "rollback");
    const failed = await call("join", {
      hash: "rollback",
      fullname: "Rollback",
      email: "rollback@example.invalid",
      passwordHash: "test",
      sessionHash: "joined-session",
    });
    assert.ok(failed.error);
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS count FROM users WHERE email='rollback@example.invalid'",
        )
      ).rows[0].count,
      0,
    );
    assert.equal(
      (await call("preview", { hash: "rollback" })).householdName,
      "Family",
    );
    const child = await call("child", {
      caller: 1,
      household: 1,
      fullname: "Little hero",
      email: "child@children.taskdira.invalid",
      passwordHash: "random",
      avatar: '{"baseIconId":"fox"}',
    });
    const context = await call("context", { caller: 1, target: child.userId });
    assert.deepEqual(context, {
      active: true,
      canRead: true,
      isManagedProfile: true,
    });
    assert.equal(
      (await call("invite", { caller: child.userId, household: 1 })).error,
      "forbidden",
    );
    assert.ok(
      (
        await call("switch", {
          caller: 1,
          household: 1,
          child: 2,
          oldHash: "parent-session",
          sessionHash: "bad-switch",
        })
      ).error,
    );
    const switched = await call("switch", {
      caller: 1,
      household: 1,
      child: child.userId,
      oldHash: "parent-session",
      sessionHash: "child-session",
    });
    assert.equal(switched.userId, child.userId);
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS count FROM sessions WHERE tokenhash='parent-session'",
        )
      ).rows[0].count,
      0,
    );
    await call("pair", { hash: "device-secret", codeHash: "short-code" });
    assert.equal((await call("poll", { hash: "device-secret" })).pending, true);
    assert.ok((await call("poll", { hash: "short-code" })).error);
    await call("approve", {
      caller: 1,
      household: 1,
      child: child.userId,
      codeHash: "short-code",
    });
    assert.equal(
      (
        await call("poll", {
          hash: "device-secret",
          sessionHash: "paired-session",
        })
      ).userId,
      child.userId,
    );
    assert.ok(
      (
        await call("poll", {
          hash: "device-secret",
          sessionHash: "replayed-session",
        })
      ).error,
    );
    const list = await call("list", { caller: 1, household: 1 });
    assert.equal(list.children.length, 1);
    assert.equal(list.invitations.length, 4);
    assert.equal(JSON.stringify(list).includes("tokenhash"), false);
    await db.exec(`DELETE FROM householdmembers WHERE userid=${child.userId}`);
    assert.equal(
      (await call("context", { caller: child.userId, target: child.userId }))
        .active,
      false,
    );
  } finally {
    await db.close();
  }
});
