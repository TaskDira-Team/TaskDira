CREATE OR REPLACE FUNCTION public.neondb_stp_claim_reward(p_id integer, p_userid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH claimed AS (
        UPDATE rewards SET claimedbyuserid = p_userid
        WHERE id = p_id AND claimedbyuserid IS NULL
        RETURNING 1
    )
    SELECT count(*)::int FROM claimed;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_categories()
 RETURNS integer
 LANGUAGE sql
AS $function$
    SELECT count(*)::int FROM categories;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_household_members(p_householdid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    SELECT count(*)::int FROM householdmembers WHERE householdid = p_householdid;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_household_rewards(p_householdid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    SELECT count(*)::int FROM rewards WHERE householdid = p_householdid;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_household_tasks(p_householdid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    SELECT count(*)::int FROM tasks WHERE householdid = p_householdid;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_households(p_userid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    SELECT count(*)::int FROM householdinfo h
    JOIN householdmembers hm ON hm.householdid = h.id
    WHERE hm.userid = p_userid;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_leaderboard(p_householdid integer, p_month integer, p_year integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    SELECT count(*)::int FROM monthlyleaderboard
    WHERE householdid = p_householdid AND month = p_month AND year = p_year;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_points_ledger(p_householdid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$ SELECT count(*)::int FROM pointsleader WHERE householdid = p_householdid; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_points_ledger_for_task(p_taskid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$ SELECT COUNT(*)::integer FROM pointsleader WHERE taskid = p_taskid; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_task_sub_items(p_taskid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    SELECT count(*)::int FROM tasksubitems WHERE taskid = p_taskid;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_count_users()
 RETURNS integer
 LANGUAGE sql
AS $function$
    SELECT count(*)::int FROM users;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_category(p_id integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH deleted AS (
        DELETE FROM categories WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_expired_sessions()
 RETURNS integer
 LANGUAGE sql
AS $function$ WITH deleted AS (DELETE FROM sessions WHERE expiresat <= (now() AT TIME ZONE 'utc') RETURNING id) SELECT COUNT(*)::integer FROM deleted; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_household(p_id integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH deleted AS (
        DELETE FROM householdinfo WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_household_member(p_householdid integer, p_userid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH deleted AS (
        DELETE FROM householdmembers
        WHERE householdid = p_householdid AND userid = p_userid
        RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_reward(p_id integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH deleted AS (
        DELETE FROM rewards WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_session_by_token_hash(p_tokenhash text)
 RETURNS integer
 LANGUAGE sql
AS $function$ WITH deleted AS (DELETE FROM sessions WHERE tokenhash = p_tokenhash RETURNING id) SELECT COUNT(*)::integer FROM deleted; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_task(p_id integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH deleted AS (
        DELETE FROM tasks WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_task_sub_item(p_id integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH deleted AS (
        DELETE FROM tasksubitems WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_delete_user(p_id integer)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH deleted AS (
        DELETE FROM users WHERE id = p_id RETURNING 1
    )
    SELECT count(*)::int FROM deleted;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_categories_page(p_offset integer, p_limit integer)
 RETURNS SETOF categories
 LANGUAGE sql
AS $function$
    SELECT * FROM categories ORDER BY id OFFSET p_offset LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_category_by_id(p_id integer)
 RETURNS SETOF categories
 LANGUAGE sql
AS $function$
    SELECT * FROM categories WHERE id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_household_by_id(p_id integer)
 RETURNS SETOF householdinfo
 LANGUAGE sql
AS $function$
    SELECT * FROM householdinfo WHERE id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_household_member_by_id(p_householdid integer, p_userid integer)
 RETURNS SETOF householdmembers
 LANGUAGE sql
AS $function$
    SELECT * FROM householdmembers
    WHERE householdid = p_householdid AND userid = p_userid;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_household_members_page(p_householdid integer, p_offset integer, p_limit integer)
 RETURNS SETOF householdmembers
 LANGUAGE sql
AS $function$
    SELECT * FROM householdmembers
    WHERE householdid = p_householdid
    ORDER BY userid OFFSET p_offset LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_household_rewards_page(p_householdid integer, p_offset integer, p_limit integer)
 RETURNS SETOF rewards
 LANGUAGE sql
AS $function$
    SELECT * FROM rewards
    WHERE householdid = p_householdid
    ORDER BY id OFFSET p_offset LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_household_tasks_page(p_householdid integer, p_offset integer, p_limit integer)
 RETURNS SETOF tasks
 LANGUAGE sql
AS $function$
    SELECT * FROM tasks
    WHERE householdid = p_householdid
    ORDER BY id OFFSET p_offset LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_households_page(p_userid integer, p_offset integer, p_limit integer)
 RETURNS SETOF householdinfo
 LANGUAGE sql
AS $function$
    SELECT h.* FROM householdinfo h
    JOIN householdmembers hm ON hm.householdid = h.id
    WHERE hm.userid = p_userid
    ORDER BY h.id OFFSET p_offset LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_leaderboard(p_householdid integer, p_month integer, p_year integer, p_offset integer, p_limit integer)
 RETURNS SETOF monthlyleaderboard
 LANGUAGE sql
AS $function$
    SELECT * FROM monthlyleaderboard
    WHERE householdid = p_householdid AND month = p_month AND year = p_year
    ORDER BY rank OFFSET p_offset LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_points_ledger_by_id(p_id integer)
 RETURNS SETOF pointsleader
 LANGUAGE sql
AS $function$
    SELECT * FROM pointsleader WHERE id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_points_ledger_page(p_householdid integer, p_offset integer, p_limit integer)
 RETURNS SETOF pointsleader
 LANGUAGE sql
AS $function$ SELECT * FROM pointsleader WHERE householdid = p_householdid ORDER BY earnedat DESC, id DESC OFFSET p_offset LIMIT p_limit; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_reward_by_id(p_id integer)
 RETURNS SETOF rewards
 LANGUAGE sql
AS $function$
    SELECT * FROM rewards WHERE id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_session_by_token_hash(p_tokenhash text)
 RETURNS SETOF sessions
 LANGUAGE sql
AS $function$ SELECT * FROM sessions WHERE tokenhash = p_tokenhash; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_task_by_id(p_id integer)
 RETURNS SETOF tasks
 LANGUAGE sql
AS $function$
    SELECT * FROM tasks WHERE id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_task_sub_item_by_id(p_id integer)
 RETURNS SETOF tasksubitems
 LANGUAGE sql
AS $function$
    SELECT * FROM tasksubitems WHERE id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_task_sub_items_page(p_taskid integer, p_offset integer, p_limit integer)
 RETURNS SETOF tasksubitems
 LANGUAGE sql
AS $function$
    SELECT * FROM tasksubitems
    WHERE taskid = p_taskid
    ORDER BY id OFFSET p_offset LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_user_by_email(p_email text)
 RETURNS SETOF users
 LANGUAGE sql
AS $function$
    SELECT * FROM users WHERE email = p_email;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_user_by_id(p_id integer)
 RETURNS SETOF users
 LANGUAGE sql
AS $function$
    SELECT * FROM users WHERE id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_user_leaderboard_entry(p_householdid integer, p_userid integer, p_month integer, p_year integer)
 RETURNS SETOF monthlyleaderboard
 LANGUAGE sql
AS $function$
    SELECT * FROM monthlyleaderboard
    WHERE householdid = p_householdid AND userid = p_userid AND month = p_month AND year = p_year;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_user_points_balance(p_householdid integer, p_userid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$ SELECT COALESCE(SUM(pointsearned), 0)::int FROM pointsleader WHERE userid = p_userid AND householdid = p_householdid; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_user_points_total(p_householdid integer, p_userid integer)
 RETURNS integer
 LANGUAGE sql
AS $function$ SELECT COALESCE(SUM(pointsearned), 0)::int FROM pointsleader WHERE userid = p_userid AND householdid = p_householdid AND pointsearned > 0; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_get_users_page(p_offset integer, p_limit integer)
 RETURNS SETOF users
 LANGUAGE sql
AS $function$
    SELECT * FROM users ORDER BY id OFFSET p_offset LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_category(p_name text, p_description text)
 RETURNS SETOF categories
 LANGUAGE sql
AS $function$
    INSERT INTO categories (name, description)
    VALUES (p_name, p_description)
    RETURNING *;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_household(p_name text, p_adminuserid integer)
 RETURNS SETOF householdinfo
 LANGUAGE sql
AS $function$
    INSERT INTO householdinfo (name, adminuserid)
    VALUES (p_name, p_adminuserid)
    RETURNING *;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_household_member(p_householdid integer, p_userid integer, p_role text)
 RETURNS SETOF householdmembers
 LANGUAGE sql
AS $function$
    INSERT INTO householdmembers (householdid, userid, role)
    VALUES (p_householdid, p_userid, p_role)
    RETURNING *;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_household_with_admin(p_name text, p_adminuserid integer, p_role text, p_address text, p_monthlygoalpoints integer, p_requireproofapproval boolean)
 RETURNS SETOF householdinfo
 LANGUAGE sql
AS $function$ WITH new_household AS (INSERT INTO householdinfo (name, adminuserid, address, monthlygoalpoints, requireproofapproval) VALUES (p_name, p_adminuserid, p_address, COALESCE(p_monthlygoalpoints, 400), COALESCE(p_requireproofapproval, false)) RETURNING *), new_member AS (INSERT INTO householdmembers (householdid, userid, role) SELECT id, p_adminuserid, p_role FROM new_household RETURNING 1) SELECT * FROM new_household; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_points_ledger(p_householdid integer, p_userid integer, p_taskid integer, p_pointsearned integer)
 RETURNS SETOF pointsleader
 LANGUAGE sql
AS $function$ INSERT INTO pointsleader (householdid, userid, taskid, pointsearned) VALUES (p_householdid, p_userid, p_taskid, p_pointsearned) ON CONFLICT (taskid) WHERE pointsearned > 0 DO NOTHING RETURNING *; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_points_spend(p_householdid integer, p_userid integer, p_rewardid integer, p_points integer)
 RETURNS SETOF pointsleader
 LANGUAGE sql
AS $function$ INSERT INTO pointsleader (householdid, userid, rewardid, taskid, pointsearned) SELECT p_householdid, p_userid, p_rewardid, NULL, -abs(p_points) WHERE (SELECT COALESCE(SUM(pointsearned), 0) FROM pointsleader WHERE userid = p_userid AND householdid = p_householdid) >= abs(p_points) RETURNING *; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_reward(p_title text, p_requiredpoints integer, p_householdid integer, p_emoji text, p_description text, p_cost integer, p_category text)
 RETURNS SETOF rewards
 LANGUAGE sql
AS $function$ INSERT INTO rewards (title, requiredpoints, householdid, emoji, description, cost, category) VALUES (p_title, p_requiredpoints, p_householdid, p_emoji, p_description, COALESCE(p_cost, p_requiredpoints), p_category) RETURNING *; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_session(p_userid integer, p_tokenhash text, p_expiresat timestamp without time zone)
 RETURNS SETOF sessions
 LANGUAGE sql
AS $function$ INSERT INTO sessions (userid, tokenhash, expiresat) VALUES (p_userid, p_tokenhash, p_expiresat) RETURNING *; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_task(p_householdid integer, p_title text, p_description text, p_categoryid integer, p_pointsvalue integer, p_assigneduserid integer, p_duedate timestamp without time zone, p_createdbyid integer)
 RETURNS SETOF tasks
 LANGUAGE sql
AS $function$ INSERT INTO tasks (householdid, title, description, categoryid, pointsvalue, assigneduserid, duedate, createdbyid) VALUES (p_householdid, p_title, p_description, p_categoryid, p_pointsvalue, p_assigneduserid, p_duedate, p_createdbyid) RETURNING *; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_task_sub_item(p_taskid integer, p_itemtext text)
 RETURNS SETOF tasksubitems
 LANGUAGE sql
AS $function$
    INSERT INTO tasksubitems (taskid, itemtext)
    VALUES (p_taskid, p_itemtext)
    RETURNING *;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_insert_user(p_fullname text, p_email text, p_passwordhash text, p_familyrole text, p_avatarstate text)
 RETURNS SETOF users
 LANGUAGE sql
AS $function$ INSERT INTO users (fullname, email, passwordhash, familyrole, avatarstate) VALUES (p_fullname, p_email, p_passwordhash, COALESCE(p_familyrole, 'roommate'), COALESCE(p_avatarstate::jsonb, '"neutral"'::jsonb)) RETURNING *; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_is_household_member(p_householdid integer, p_userid integer)
 RETURNS boolean
 LANGUAGE sql
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM householdmembers
        WHERE householdid = p_householdid AND userid = p_userid
    );
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_update_category(p_id integer, p_name text, p_description text)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH updated AS (
        UPDATE categories SET name = p_name, description = p_description
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_update_household(p_id integer, p_name text, p_address text, p_monthlygoalpoints integer, p_requireproofapproval boolean)
 RETURNS integer
 LANGUAGE sql
AS $function$ WITH updated AS (UPDATE householdinfo SET name = p_name, address = p_address, monthlygoalpoints = COALESCE(p_monthlygoalpoints, monthlygoalpoints), requireproofapproval = COALESCE(p_requireproofapproval, requireproofapproval) WHERE id = p_id RETURNING 1) SELECT count(*)::int FROM updated; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_update_household_member_role(p_householdid integer, p_userid integer, p_role text)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH updated AS (
        UPDATE householdmembers SET role = p_role
        WHERE householdid = p_householdid AND userid = p_userid
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_update_reward(p_id integer, p_title text, p_requiredpoints integer, p_emoji text, p_description text, p_cost integer, p_category text)
 RETURNS integer
 LANGUAGE sql
AS $function$ WITH updated AS (UPDATE rewards SET title = p_title, requiredpoints = p_requiredpoints, emoji = p_emoji, description = p_description, cost = COALESCE(p_cost, p_requiredpoints), category = p_category WHERE id = p_id RETURNING 1) SELECT count(*)::int FROM updated; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_update_task(p_id integer, p_title text, p_description text, p_categoryid integer, p_pointsvalue integer, p_assigneduserid integer, p_duedate timestamp without time zone)
 RETURNS integer
 LANGUAGE sql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_update_task_status(p_id integer, p_status text, p_completedat timestamp without time zone)
 RETURNS integer
 LANGUAGE sql
AS $function$ WITH updated AS (UPDATE tasks SET status = p_status, completedat = CASE WHEN p_status = 'Done' THEN COALESCE(p_completedat, now() AT TIME ZONE 'utc') ELSE NULL END WHERE id = p_id RETURNING 1) SELECT count(*)::int FROM updated; $function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_update_task_sub_item(p_id integer, p_itemtext text, p_iscompleted boolean)
 RETURNS integer
 LANGUAGE sql
AS $function$
    WITH updated AS (
        UPDATE tasksubitems SET itemtext = p_itemtext, iscompleted = p_iscompleted
        WHERE id = p_id
        RETURNING 1
    )
    SELECT count(*)::int FROM updated;
$function$
;

CREATE OR REPLACE FUNCTION public.neondb_stp_update_user(p_id integer, p_fullname text, p_avatarstate text, p_familyrole text)
 RETURNS integer
 LANGUAGE sql
AS $function$ WITH updated AS (UPDATE users SET fullname = p_fullname, avatarstate = COALESCE(p_avatarstate::jsonb, avatarstate), familyrole = COALESCE(p_familyrole, familyrole) WHERE id = p_id RETURNING 1) SELECT count(*)::int FROM updated; $function$
;