import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('family world: tenant isolation, earned progress, support authority and placement persistence',async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE users(id int PRIMARY KEY); CREATE TABLE householdinfo(id int PRIMARY KEY);
      CREATE TABLE householdmembers(householdid int,userid int,role text);
      CREATE TABLE managedprofiles(userid int); CREATE TABLE tasks(id int PRIMARY KEY,householdid int,status text);
      INSERT INTO users VALUES(1),(2),(3); INSERT INTO householdinfo VALUES(1),(2);
      INSERT INTO householdmembers VALUES(1,1,'Admin'),(1,2,'Member'),(2,3,'Admin');
      INSERT INTO managedprofiles VALUES(2); INSERT INTO tasks VALUES(1,1,'Done'),(2,1,'Done'),(3,1,'PendingApproval'),(4,2,'Done');`);
    await db.exec(await readFile(new URL('../../db/migrations/007_family_world.sql',import.meta.url),'utf8'));
    const call=async(action,data={})=>JSON.parse((await db.query('SELECT neondb_stp_family_world($1,$2) AS result',[action,JSON.stringify({household:1,caller:1,...data})])).rows[0].result);
    assert.equal((await call('read',{caller:3})).error,'forbidden');
    assert.equal((await call('read')).completed,2);
    assert.ok((await call('place',{piece:'garden',position:'left'})).error);
    await db.exec("UPDATE tasks SET status='Done' WHERE id=3");
    assert.equal((await call('read')).completed,3);
    assert.equal((await call('read')).completed,3);
    assert.equal((await call('support',{caller:2,target:2,skill:'tidying',level:'independent'})).error,'forbidden');
    assert.equal((await call('support',{target:3,skill:'tidying',level:'together'})).error,'forbidden');
    await call('support',{target:2,skill:'tidying',level:'together'});
    await call('support',{target:1,skill:'kitchen',level:'independent'});
    assert.equal((await call('read',{caller:2})).support.length,1);
    assert.equal((await call('place',{caller:2,piece:'garden',position:'right'})).placements.garden,'right');
    assert.ok((await call('place',{caller:2,piece:'anything',position:'right'})).error);
    await db.exec("DELETE FROM tasks WHERE householdid=1");
    const persisted=await call('read',{caller:2});
    assert.equal(persisted.completed,3); assert.equal(persisted.placements.garden,'right');
    await db.exec('DELETE FROM householdmembers WHERE userid=2');
    assert.equal((await call('read',{caller:2})).error,'forbidden');
  } finally { await db.close(); }
});
