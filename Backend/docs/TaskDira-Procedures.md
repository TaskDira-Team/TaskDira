# TaskDira — Stored Procedures for Neon

Paste these into the **Neon SQL editor**. Each block below is **independently runnable** — you can run them one entity at a time (matches your one-at-a-time flow) or all at once.

## How these work

- They are Postgres **functions**, not `CREATE PROCEDURE`. True Postgres procedures can't return result sets to a query, so functions are the correct tool for read/insert-returning. They still follow your `neondb_stp_` naming.
- `CREATE OR REPLACE` — safe to re-run any time.
- Calling convention (this is what the repositories will use via Dapper):
  - reads: `SELECT * FROM neondb_stp_get_user_by_id(5);`
  - counts / scalars: `SELECT neondb_stp_count_users();`
- **Read procs return `SETOF <table>`** — the whole row, so they keep working if you add columns later.
- **Update / delete procs return an `int`** = rows affected. The repository turns `> 0` into its `bool`.
- **Insert procs return the inserted row** (`RETURNING *`) so the repository gets the generated id and DB defaults.

## ⚠️ Two things baked in on purpose

1. **The points table is physically named `pointsleader`** (the accidental rename you deferred). Every proc below that touches it references `pointsleader`, not `pointsledger`. If you ever rename the table in Neon, update these four procs.
2. **`duedate` params are `timestamp`** (no time zone), matching the column as it currently exists. If you later convert those columns to `timestamptz`, change the param types to match.

---

## Users

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_user_by_id(p_id integer)
RETURNS SETOF users LANGUAGE sql AS $$
    SELECT * FROM users WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_user_by_email(p_email text)
RETURNS SETOF users LANGUAGE sql AS $$
    SELECT * FROM users WHERE email = p_email;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_users_page(p_offset integer, p_limit integer)
RETURNS SETOF users LANGUAGE sql AS $$
    SELECT * FROM users ORDER BY id OFFSET p_offset LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_count_users()
RETURNS integer LANGUAGE sql AS $$
    SELECT count(*)::int FROM users;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_user(p_fullname text, p_email text, p_passwordhash text)
RETURNS SETOF users LANGUAGE sql AS $$
    INSERT INTO users (fullname, email, passwordhash)
    VALUES (p_fullname, p_email, p_passwordhash)
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_update_user(p_id integer, p_fullname text, p_avatarstate text)
RETURNS integer LANGUAGE sql AS $$
    WITH updated AS (
        UPDATE users SET fullname = p_fullname, avatarstate = p_avatarstate
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_user(p_id integer)
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (
        DELETE FROM users WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$$;
```

---

## Categories

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_category_by_id(p_id integer)
RETURNS SETOF categories LANGUAGE sql AS $$
    SELECT * FROM categories WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_categories_page(p_offset integer, p_limit integer)
RETURNS SETOF categories LANGUAGE sql AS $$
    SELECT * FROM categories ORDER BY id OFFSET p_offset LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_count_categories()
RETURNS integer LANGUAGE sql AS $$
    SELECT count(*)::int FROM categories;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_category(p_name text, p_description text)
RETURNS SETOF categories LANGUAGE sql AS $$
    INSERT INTO categories (name, description)
    VALUES (p_name, p_description)
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_update_category(p_id integer, p_name text, p_description text)
RETURNS integer LANGUAGE sql AS $$
    WITH updated AS (
        UPDATE categories SET name = p_name, description = p_description
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_category(p_id integer)
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (
        DELETE FROM categories WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$$;
```

---

## Households (`householdinfo`)

> **Verify:** if a user should only see households they belong to, `get_households_page` needs a `p_userid` filter (join `householdmembers`). As written it returns all households, matching the unscoped User template.

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_household_by_id(p_id integer)
RETURNS SETOF householdinfo LANGUAGE sql AS $$
    SELECT * FROM householdinfo WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_households_page(p_offset integer, p_limit integer)
RETURNS SETOF householdinfo LANGUAGE sql AS $$
    SELECT * FROM householdinfo ORDER BY id OFFSET p_offset LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_count_households()
RETURNS integer LANGUAGE sql AS $$
    SELECT count(*)::int FROM householdinfo;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_household(p_name text, p_adminuserid integer)
RETURNS SETOF householdinfo LANGUAGE sql AS $$
    INSERT INTO householdinfo (name, adminuserid)
    VALUES (p_name, p_adminuserid)
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_update_household(p_id integer, p_name text)
RETURNS integer LANGUAGE sql AS $$
    WITH updated AS (
        UPDATE householdinfo SET name = p_name
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_household(p_id integer)
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (
        DELETE FROM householdinfo WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$$;
```

---

## HouseholdMembers (composite key: `householdid`, `userid`)

`neondb_stp_is_household_member` is the scoping helper your services need — it backs the "verify membership before acting" invariant in CLAUDE.md §5.

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_household_members_page(p_householdid integer, p_offset integer, p_limit integer)
RETURNS SETOF householdmembers LANGUAGE sql AS $$
    SELECT * FROM householdmembers
    WHERE householdid = p_householdid
    ORDER BY userid OFFSET p_offset LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_count_household_members(p_householdid integer)
RETURNS integer LANGUAGE sql AS $$
    SELECT count(*)::int FROM householdmembers WHERE householdid = p_householdid;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_household_member_by_id(p_householdid integer, p_userid integer)
RETURNS SETOF householdmembers LANGUAGE sql AS $$
    SELECT * FROM householdmembers
    WHERE householdid = p_householdid AND userid = p_userid;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_household_member(p_householdid integer, p_userid integer, p_role text)
RETURNS SETOF householdmembers LANGUAGE sql AS $$
    INSERT INTO householdmembers (householdid, userid, role)
    VALUES (p_householdid, p_userid, p_role)
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_update_household_member_role(p_householdid integer, p_userid integer, p_role text)
RETURNS integer LANGUAGE sql AS $$
    WITH updated AS (
        UPDATE householdmembers SET role = p_role
        WHERE householdid = p_householdid AND userid = p_userid
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_household_member(p_householdid integer, p_userid integer)
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (
        DELETE FROM householdmembers
        WHERE householdid = p_householdid AND userid = p_userid
        RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_is_household_member(p_householdid integer, p_userid integer)
RETURNS boolean LANGUAGE sql AS $$
    SELECT EXISTS (
        SELECT 1 FROM householdmembers
        WHERE householdid = p_householdid AND userid = p_userid
    );
$$;
```

---

## ChoreTasks (`tasks`)

Status transitions are validated in the **service** (state machine), so `update_task_status` just writes — it does not judge legality.

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_household_tasks_page(p_householdid integer, p_offset integer, p_limit integer)
RETURNS SETOF tasks LANGUAGE sql AS $$
    SELECT * FROM tasks
    WHERE householdid = p_householdid
    ORDER BY id OFFSET p_offset LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_count_household_tasks(p_householdid integer)
RETURNS integer LANGUAGE sql AS $$
    SELECT count(*)::int FROM tasks WHERE householdid = p_householdid;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_task_by_id(p_id integer)
RETURNS SETOF tasks LANGUAGE sql AS $$
    SELECT * FROM tasks WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_task(
    p_householdid integer,
    p_title text,
    p_description text,
    p_categoryid integer,
    p_pointsvalue integer,
    p_assigneduserid integer,
    p_duedate timestamp)
RETURNS SETOF tasks LANGUAGE sql AS $$
    INSERT INTO tasks (householdid, title, description, categoryid, pointsvalue, assigneduserid, duedate)
    VALUES (p_householdid, p_title, p_description, p_categoryid, p_pointsvalue, p_assigneduserid, p_duedate)
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_update_task(
    p_id integer,
    p_title text,
    p_description text,
    p_categoryid integer,
    p_pointsvalue integer,
    p_assigneduserid integer,
    p_duedate timestamp)
RETURNS integer LANGUAGE sql AS $$
    WITH updated AS (
        UPDATE tasks SET
            title = p_title,
            description = p_description,
            categoryid = p_categoryid,
            pointsvalue = p_pointsvalue,
            assigneduserid = p_assigneduserid,
            duedate = p_duedate
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_update_task_status(p_id integer, p_status text, p_proofimageurl text)
RETURNS integer LANGUAGE sql AS $$
    WITH updated AS (
        UPDATE tasks SET status = p_status, proofimageurl = p_proofimageurl
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_task(p_id integer)
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (
        DELETE FROM tasks WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$$;
```

---

## TaskSubItems (`tasksubitems`)

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_task_sub_items_page(p_taskid integer, p_offset integer, p_limit integer)
RETURNS SETOF tasksubitems LANGUAGE sql AS $$
    SELECT * FROM tasksubitems
    WHERE taskid = p_taskid
    ORDER BY id OFFSET p_offset LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_count_task_sub_items(p_taskid integer)
RETURNS integer LANGUAGE sql AS $$
    SELECT count(*)::int FROM tasksubitems WHERE taskid = p_taskid;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_task_sub_item_by_id(p_id integer)
RETURNS SETOF tasksubitems LANGUAGE sql AS $$
    SELECT * FROM tasksubitems WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_task_sub_item(p_taskid integer, p_itemtext text)
RETURNS SETOF tasksubitems LANGUAGE sql AS $$
    INSERT INTO tasksubitems (taskid, itemtext)
    VALUES (p_taskid, p_itemtext)
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_update_task_sub_item(p_id integer, p_itemtext text, p_iscompleted boolean)
RETURNS integer LANGUAGE sql AS $$
    WITH updated AS (
        UPDATE tasksubitems SET itemtext = p_itemtext, iscompleted = p_iscompleted
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_task_sub_item(p_id integer)
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (
        DELETE FROM tasksubitems WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$$;
```

---

## PointsLedger (physical table: `pointsleader`)

The ledger has no `householdid` column, so household-scoped reads join through `tasks`. `award_points` is the single insert — one row per award, per CLAUDE.md §5.4.

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_points_ledger_page(p_householdid integer, p_offset integer, p_limit integer)
RETURNS SETOF pointsleader LANGUAGE sql AS $$
    SELECT pl.* FROM pointsleader pl
    JOIN tasks t ON t.id = pl.taskid
    WHERE t.householdid = p_householdid
    ORDER BY pl.earnedat DESC, pl.id DESC
    OFFSET p_offset LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_count_points_ledger(p_householdid integer)
RETURNS integer LANGUAGE sql AS $$
    SELECT count(*)::int FROM pointsleader pl
    JOIN tasks t ON t.id = pl.taskid
    WHERE t.householdid = p_householdid;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_user_points_total(p_userid integer)
RETURNS bigint LANGUAGE sql AS $$
    SELECT COALESCE(SUM(pointsearned), 0)::bigint FROM pointsleader WHERE userid = p_userid;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_points_ledger(p_userid integer, p_taskid integer, p_pointsearned integer)
RETURNS SETOF pointsleader LANGUAGE sql AS $$
    INSERT INTO pointsleader (userid, taskid, pointsearned)
    VALUES (p_userid, p_taskid, p_pointsearned)
    RETURNING *;
$$;
```

---

## Rewards (`rewards`)

`claim_reward` claims **only if unclaimed** (`claimedbyuserid IS NULL`), so a double-claim returns `0` and the service can map that to a conflict.

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_household_rewards_page(p_householdid integer, p_offset integer, p_limit integer)
RETURNS SETOF rewards LANGUAGE sql AS $$
    SELECT * FROM rewards
    WHERE householdid = p_householdid
    ORDER BY id OFFSET p_offset LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_count_household_rewards(p_householdid integer)
RETURNS integer LANGUAGE sql AS $$
    SELECT count(*)::int FROM rewards WHERE householdid = p_householdid;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_reward_by_id(p_id integer)
RETURNS SETOF rewards LANGUAGE sql AS $$
    SELECT * FROM rewards WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_reward(p_title text, p_requiredpoints integer, p_householdid integer)
RETURNS SETOF rewards LANGUAGE sql AS $$
    INSERT INTO rewards (title, requiredpoints, householdid)
    VALUES (p_title, p_requiredpoints, p_householdid)
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_update_reward(p_id integer, p_title text, p_requiredpoints integer)
RETURNS integer LANGUAGE sql AS $$
    WITH updated AS (
        UPDATE rewards SET title = p_title, requiredpoints = p_requiredpoints
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_claim_reward(p_id integer, p_userid integer)
RETURNS integer LANGUAGE sql AS $$
    WITH claimed AS (
        UPDATE rewards SET claimedbyuserid = p_userid
        WHERE id = p_id AND claimedbyuserid IS NULL
        RETURNING 1
    )
    SELECT count(*)::int FROM claimed;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_reward(p_id integer)
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (
        DELETE FROM rewards WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$$;
```

---

## MonthlyLeaderboard (`monthlyleaderboard`)

Read-only over the API (no create/update/delete endpoints exist), so just the two reads. Ordered by `rank`.

```sql
CREATE OR REPLACE FUNCTION neondb_stp_get_leaderboard(p_householdid integer, p_month integer, p_year integer)
RETURNS SETOF monthlyleaderboard LANGUAGE sql AS $$
    SELECT * FROM monthlyleaderboard
    WHERE householdid = p_householdid AND month = p_month AND year = p_year
    ORDER BY rank;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_user_leaderboard_entry(p_householdid integer, p_userid integer, p_month integer, p_year integer)
RETURNS SETOF monthlyleaderboard LANGUAGE sql AS $$
    SELECT * FROM monthlyleaderboard
    WHERE householdid = p_householdid AND userid = p_userid AND month = p_month AND year = p_year;
$$;
```

---

## Quick self-test after pasting

Run this to confirm all functions registered (should list ~52 rows, all prefixed `neondb_stp_`):

```sql
SELECT proname
FROM pg_proc
WHERE proname LIKE 'neondb_stp_%'
ORDER BY proname;
```
