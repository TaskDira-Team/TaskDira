BEGIN;

DROP FUNCTION IF EXISTS neondb_stp_insert_user(text, text, text);

CREATE FUNCTION neondb_stp_insert_user(p_fullname text, p_email text, p_passwordhash text, p_familyrole text, p_avatarstate text) RETURNS SETOF users LANGUAGE sql AS $$ INSERT INTO users (fullname, email, passwordhash, familyrole, avatarstate) VALUES (p_fullname, p_email, p_passwordhash, COALESCE(p_familyrole, 'roommate'), COALESCE(p_avatarstate::jsonb, '"neutral"'::jsonb)) RETURNING *; $$;

DROP FUNCTION IF EXISTS neondb_stp_update_user(integer, text, text);

CREATE FUNCTION neondb_stp_update_user(p_id integer, p_fullname text, p_avatarstate text, p_familyrole text) RETURNS integer LANGUAGE sql AS $$ WITH updated AS (UPDATE users SET fullname = p_fullname, avatarstate = COALESCE(p_avatarstate::jsonb, avatarstate), familyrole = COALESCE(p_familyrole, familyrole) WHERE id = p_id RETURNING 1) SELECT count(*)::int FROM updated; $$;

DROP FUNCTION IF EXISTS neondb_stp_update_household(integer, text);

CREATE FUNCTION neondb_stp_update_household(p_id integer, p_name text, p_address text, p_monthlygoalpoints integer, p_requireproofapproval boolean) RETURNS integer LANGUAGE sql AS $$ WITH updated AS (UPDATE householdinfo SET name = p_name, address = p_address, monthlygoalpoints = COALESCE(p_monthlygoalpoints, monthlygoalpoints), requireproofapproval = COALESCE(p_requireproofapproval, requireproofapproval) WHERE id = p_id RETURNING 1) SELECT count(*)::int FROM updated; $$;

DROP FUNCTION IF EXISTS neondb_stp_insert_household_with_admin(text, integer, text);

CREATE FUNCTION neondb_stp_insert_household_with_admin(p_name text, p_adminuserid integer, p_role text, p_address text, p_monthlygoalpoints integer, p_requireproofapproval boolean) RETURNS SETOF householdinfo LANGUAGE sql AS $$ WITH new_household AS (INSERT INTO householdinfo (name, adminuserid, address, monthlygoalpoints, requireproofapproval) VALUES (p_name, p_adminuserid, p_address, COALESCE(p_monthlygoalpoints, 400), COALESCE(p_requireproofapproval, false)) RETURNING *), new_member AS (INSERT INTO householdmembers (householdid, userid, role) SELECT id, p_adminuserid, p_role FROM new_household RETURNING 1) SELECT * FROM new_household; $$;

DROP FUNCTION IF EXISTS neondb_stp_insert_reward(text, integer, integer);

CREATE FUNCTION neondb_stp_insert_reward(p_title text, p_requiredpoints integer, p_householdid integer, p_emoji text, p_description text, p_cost integer, p_category text) RETURNS SETOF rewards LANGUAGE sql AS $$ INSERT INTO rewards (title, requiredpoints, householdid, emoji, description, cost, category) VALUES (p_title, p_requiredpoints, p_householdid, p_emoji, p_description, COALESCE(p_cost, p_requiredpoints), p_category) RETURNING *; $$;

DROP FUNCTION IF EXISTS neondb_stp_update_reward(integer, text, integer);

CREATE FUNCTION neondb_stp_update_reward(p_id integer, p_title text, p_requiredpoints integer, p_emoji text, p_description text, p_cost integer, p_category text) RETURNS integer LANGUAGE sql AS $$ WITH updated AS (UPDATE rewards SET title = p_title, requiredpoints = p_requiredpoints, emoji = p_emoji, description = p_description, cost = COALESCE(p_cost, p_requiredpoints), category = p_category WHERE id = p_id RETURNING 1) SELECT count(*)::int FROM updated; $$;

DROP FUNCTION IF EXISTS neondb_stp_insert_task(integer, text, text, integer, integer, integer, timestamp without time zone);

CREATE FUNCTION neondb_stp_insert_task(p_householdid integer, p_title text, p_description text, p_categoryid integer, p_pointsvalue integer, p_assigneduserid integer, p_duedate timestamp without time zone, p_createdbyid integer) RETURNS SETOF tasks LANGUAGE sql AS $$ INSERT INTO tasks (householdid, title, description, categoryid, pointsvalue, assigneduserid, duedate, createdbyid) VALUES (p_householdid, p_title, p_description, p_categoryid, p_pointsvalue, p_assigneduserid, p_duedate, p_createdbyid) RETURNING *; $$;

DROP FUNCTION IF EXISTS neondb_stp_update_task_status(integer, text);

CREATE FUNCTION neondb_stp_update_task_status(p_id integer, p_status text, p_completedat timestamp without time zone) RETURNS integer LANGUAGE sql AS $$ WITH updated AS (UPDATE tasks SET status = p_status, completedat = CASE WHEN p_status = 'Done' THEN COALESCE(p_completedat, now() AT TIME ZONE 'utc') ELSE NULL END WHERE id = p_id RETURNING 1) SELECT count(*)::int FROM updated; $$;

DROP FUNCTION IF EXISTS neondb_stp_insert_points_ledger(integer, integer, integer);

CREATE FUNCTION neondb_stp_insert_points_ledger(p_householdid integer, p_userid integer, p_taskid integer, p_pointsearned integer) RETURNS SETOF pointsleader LANGUAGE sql AS $$ INSERT INTO pointsleader (householdid, userid, taskid, pointsearned) VALUES (p_householdid, p_userid, p_taskid, p_pointsearned) ON CONFLICT (taskid) WHERE pointsearned > 0 DO NOTHING RETURNING *; $$;

CREATE OR REPLACE FUNCTION neondb_stp_get_user_points_total(p_householdid integer, p_userid integer) RETURNS integer LANGUAGE sql AS $$ SELECT COALESCE(SUM(pointsearned), 0)::int FROM pointsleader WHERE userid = p_userid AND householdid = p_householdid AND pointsearned > 0; $$;

CREATE OR REPLACE FUNCTION neondb_stp_get_user_points_balance(p_householdid integer, p_userid integer) RETURNS integer LANGUAGE sql AS $$ SELECT COALESCE(SUM(pointsearned), 0)::int FROM pointsleader WHERE userid = p_userid AND householdid = p_householdid; $$;

CREATE OR REPLACE FUNCTION neondb_stp_count_points_ledger(p_householdid integer) RETURNS integer LANGUAGE sql AS $$ SELECT count(*)::int FROM pointsleader WHERE householdid = p_householdid; $$;

CREATE OR REPLACE FUNCTION neondb_stp_get_points_ledger_page(p_householdid integer, p_offset integer, p_limit integer) RETURNS SETOF pointsleader LANGUAGE sql AS $$ SELECT * FROM pointsleader WHERE householdid = p_householdid ORDER BY earnedat DESC, id DESC OFFSET p_offset LIMIT p_limit; $$;

CREATE OR REPLACE FUNCTION neondb_stp_insert_points_spend(p_householdid integer, p_userid integer, p_rewardid integer, p_points integer) RETURNS SETOF pointsleader LANGUAGE sql AS $$ INSERT INTO pointsleader (householdid, userid, rewardid, taskid, pointsearned) SELECT p_householdid, p_userid, p_rewardid, NULL, -abs(p_points) WHERE (SELECT COALESCE(SUM(pointsearned), 0) FROM pointsleader WHERE userid = p_userid AND householdid = p_householdid) >= abs(p_points) RETURNING *; $$;

COMMIT;
