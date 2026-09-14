SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.neondb_stp_claim_reward
@p_id int,
@p_userid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        UPDATE rewards SET claimedbyuserid = @p_userid
        WHERE id = @p_id AND claimedbyuserid IS NULL; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_categories

AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM categories;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_household_members
@p_householdid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM householdmembers WHERE householdid = @p_householdid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_household_rewards
@p_householdid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM rewards WHERE householdid = @p_householdid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_household_tasks
@p_householdid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM tasks WHERE householdid = @p_householdid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_households
@p_userid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM householdinfo h
    JOIN householdmembers hm ON hm.householdid = h.id
    WHERE hm.userid = @p_userid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_leaderboard
@p_householdid int,
@p_month int,
@p_year int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM monthlyleaderboard
    WHERE householdid = @p_householdid AND month = @p_month AND year = @p_year;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_points_ledger
@p_householdid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM pointsleader WHERE householdid = @p_householdid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_points_ledger_for_task
@p_taskid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT COUNT(*) FROM pointsleader WHERE taskid = @p_taskid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_task_sub_items
@p_taskid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM tasksubitems WHERE taskid = @p_taskid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_count_users

AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT count(*) FROM users;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_category
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        DELETE FROM categories WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_expired_sessions

AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
DELETE FROM sessions WHERE expiresat <= (SYSUTCDATETIME()); SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_household
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        DELETE FROM householdinfo WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_household_member
@p_householdid int,
@p_userid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        DELETE FROM householdmembers
        WHERE householdid = @p_householdid AND userid = @p_userid; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_reward
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        DELETE FROM rewards WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_session_by_token_hash
@p_tokenhash nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
DELETE FROM sessions WHERE tokenhash = @p_tokenhash AND DATALENGTH(tokenhash)=DATALENGTH(@p_tokenhash); SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_task
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        DELETE FROM tasks WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_task_sub_item
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        DELETE FROM tasksubitems WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_delete_user
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        DELETE FROM users WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_categories_page
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM categories ORDER BY id OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_category_by_id
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM categories WHERE id = @p_id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_household_by_id
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM householdinfo WHERE id = @p_id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_household_member_by_id
@p_householdid int,
@p_userid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM householdmembers
    WHERE householdid = @p_householdid AND userid = @p_userid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_household_members_page
@p_householdid int,
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM householdmembers
    WHERE householdid = @p_householdid
    ORDER BY userid OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_household_rewards_page
@p_householdid int,
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM rewards
    WHERE householdid = @p_householdid
    ORDER BY id OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_household_tasks_page
@p_householdid int,
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM tasks
    WHERE householdid = @p_householdid
    ORDER BY id OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_households_page
@p_userid int,
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT h.* FROM householdinfo h
    JOIN householdmembers hm ON hm.householdid = h.id
    WHERE hm.userid = @p_userid
    ORDER BY h.id OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_leaderboard
@p_householdid int,
@p_month int,
@p_year int,
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM monthlyleaderboard
    WHERE householdid = @p_householdid AND month = @p_month AND year = @p_year
    ORDER BY CASE WHEN rank IS NULL THEN 1 ELSE 0 END, rank, id OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_points_ledger_by_id
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM pointsleader WHERE id = @p_id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_points_ledger_page
@p_householdid int,
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM pointsleader WHERE householdid = @p_householdid ORDER BY earnedat DESC, id DESC OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_reward_by_id
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM rewards WHERE id = @p_id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_session_by_token_hash
@p_tokenhash nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM sessions WHERE tokenhash = @p_tokenhash AND DATALENGTH(tokenhash)=DATALENGTH(@p_tokenhash);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_task_by_id
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM tasks WHERE id = @p_id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_task_sub_item_by_id
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM tasksubitems WHERE id = @p_id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_task_sub_items_page
@p_taskid int,
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM tasksubitems
    WHERE taskid = @p_taskid
    ORDER BY id OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_user_by_email
@p_email nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM users WHERE email = @p_email AND DATALENGTH(email)=DATALENGTH(@p_email);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_user_by_id
@p_id int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM users WHERE id = @p_id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_user_leaderboard_entry
@p_householdid int,
@p_userid int,
@p_month int,
@p_year int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM monthlyleaderboard
    WHERE householdid = @p_householdid AND userid = @p_userid AND month = @p_month AND year = @p_year;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_user_points_balance
@p_householdid int,
@p_userid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT COALESCE(SUM(pointsearned), 0) FROM pointsleader WHERE userid = @p_userid AND householdid = @p_householdid;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_user_points_total
@p_householdid int,
@p_userid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT COALESCE(SUM(pointsearned), 0) FROM pointsleader WHERE userid = @p_userid AND householdid = @p_householdid AND pointsearned > 0;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_get_users_page
@p_offset int,
@p_limit int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT * FROM users ORDER BY id OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_category
@p_name nvarchar(max),
@p_description nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
INSERT INTO categories (name, description)
    OUTPUT INSERTED.* VALUES (@p_name, @p_description);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_household
@p_name nvarchar(max),
@p_adminuserid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
INSERT INTO householdinfo (name, adminuserid)
    OUTPUT INSERTED.* VALUES (@p_name, @p_adminuserid);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_household_member
@p_householdid int,
@p_userid int,
@p_role nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
INSERT INTO householdmembers (householdid, userid, role)
    OUTPUT INSERTED.* VALUES (@p_householdid, @p_userid, @p_role);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_household_with_admin
@p_name nvarchar(max),
@p_adminuserid int,
@p_role nvarchar(max),
@p_address nvarchar(max),
@p_monthlygoalpoints int,
@p_requireproofapproval bit
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;
INSERT INTO dbo.householdinfo(name,adminuserid,address,monthlygoalpoints,requireproofapproval)
VALUES(@p_name,@p_adminuserid,@p_address,COALESCE(@p_monthlygoalpoints,400),COALESCE(@p_requireproofapproval,0));
DECLARE @newid int=CONVERT(int,SCOPE_IDENTITY());
INSERT INTO dbo.householdmembers(householdid,userid,role) VALUES(@newid,@p_adminuserid,@p_role);
COMMIT;
SELECT * FROM dbo.householdinfo WHERE id=@newid;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK;
THROW;
END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_points_ledger
@p_householdid int,
@p_userid int,
@p_taskid int,
@p_pointsearned int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;
DECLARE @locked int;
SELECT @locked=id FROM dbo.tasks WITH (UPDLOCK,HOLDLOCK) WHERE id=@p_taskid;
IF @p_pointsearned>0 AND EXISTS(SELECT 1 FROM dbo.pointsleader WHERE taskid=@p_taskid AND pointsearned>0)
BEGIN COMMIT; SELECT * FROM dbo.pointsleader WHERE 1=0; RETURN; END;
INSERT INTO dbo.pointsleader(householdid,userid,taskid,pointsearned) VALUES(@p_householdid,@p_userid,@p_taskid,@p_pointsearned);
DECLARE @newid int=CONVERT(int,SCOPE_IDENTITY());
COMMIT;
SELECT * FROM dbo.pointsleader WHERE id=@newid;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK;
THROW;
END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_points_spend
@p_householdid int,
@p_userid int,
@p_rewardid int,
@p_points int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;
DECLARE @locked int;
SELECT @locked=userid FROM dbo.householdmembers WITH (UPDLOCK,HOLDLOCK) WHERE householdid=@p_householdid AND userid=@p_userid;
IF @locked IS NULL OR @p_points=0 OR (SELECT COALESCE(SUM(CONVERT(bigint,pointsearned)),0) FROM dbo.pointsleader WHERE householdid=@p_householdid AND userid=@p_userid)<ABS(CONVERT(bigint,@p_points))
BEGIN COMMIT; SELECT * FROM dbo.pointsleader WHERE 1=0; RETURN; END;
INSERT INTO dbo.pointsleader(householdid,userid,rewardid,taskid,pointsearned) VALUES(@p_householdid,@p_userid,@p_rewardid,NULL,-ABS(@p_points));
DECLARE @newid int=CONVERT(int,SCOPE_IDENTITY());
COMMIT;
SELECT * FROM dbo.pointsleader WHERE id=@newid;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK;
THROW;
END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_reward
@p_title nvarchar(max),
@p_requiredpoints int,
@p_householdid int,
@p_emoji nvarchar(max),
@p_description nvarchar(max),
@p_cost int,
@p_category nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
INSERT INTO rewards (title, requiredpoints, householdid, emoji, description, cost, category) OUTPUT INSERTED.* VALUES (@p_title, @p_requiredpoints, @p_householdid, @p_emoji, @p_description, COALESCE(@p_cost, @p_requiredpoints), @p_category);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_session
@p_userid int,
@p_tokenhash nvarchar(max),
@p_expiresat datetime2(6)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
INSERT INTO sessions (userid, tokenhash, expiresat) OUTPUT INSERTED.* VALUES (@p_userid, @p_tokenhash, @p_expiresat);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_task
@p_householdid int,
@p_title nvarchar(max),
@p_description nvarchar(max),
@p_categoryid int,
@p_pointsvalue int,
@p_assigneduserid int,
@p_duedate datetime2(6),
@p_createdbyid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
INSERT INTO tasks (householdid, title, description, categoryid, pointsvalue, assigneduserid, duedate, createdbyid) OUTPUT INSERTED.* VALUES (@p_householdid, @p_title, @p_description, @p_categoryid, @p_pointsvalue, @p_assigneduserid, @p_duedate, @p_createdbyid);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_task_sub_item
@p_taskid int,
@p_itemtext nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
INSERT INTO tasksubitems (taskid, itemtext)
    OUTPUT INSERTED.* VALUES (@p_taskid, @p_itemtext);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_insert_user
@p_fullname nvarchar(max),
@p_email nvarchar(max),
@p_passwordhash nvarchar(max),
@p_familyrole nvarchar(max),
@p_avatarstate nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
INSERT INTO users (fullname, email, passwordhash, familyrole, avatarstate) OUTPUT INSERTED.* VALUES (@p_fullname, @p_email, @p_passwordhash, COALESCE(@p_familyrole, N'roommate'), COALESCE(@p_avatarstate, N'"neutral"'));
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_is_household_member
@p_householdid int,
@p_userid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.householdmembers WHERE householdid=@p_householdid AND userid=@p_userid) THEN 1 ELSE 0 END AS bit);
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_update_category
@p_id int,
@p_name nvarchar(max),
@p_description nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        UPDATE categories SET name = @p_name, description = @p_description
        WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_update_household
@p_id int,
@p_name nvarchar(max),
@p_address nvarchar(max),
@p_monthlygoalpoints int,
@p_requireproofapproval bit
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
UPDATE householdinfo SET name = @p_name, address = @p_address, monthlygoalpoints = COALESCE(@p_monthlygoalpoints, monthlygoalpoints), requireproofapproval = COALESCE(@p_requireproofapproval, requireproofapproval) WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_update_household_member_role
@p_householdid int,
@p_userid int,
@p_role nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        UPDATE householdmembers SET role = @p_role
        WHERE householdid = @p_householdid AND userid = @p_userid; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_update_reward
@p_id int,
@p_title nvarchar(max),
@p_requiredpoints int,
@p_emoji nvarchar(max),
@p_description nvarchar(max),
@p_cost int,
@p_category nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
UPDATE rewards SET title = @p_title, requiredpoints = @p_requiredpoints, emoji = @p_emoji, description = @p_description, cost = COALESCE(@p_cost, @p_requiredpoints), category = @p_category WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_update_task
@p_id int,
@p_title nvarchar(max),
@p_description nvarchar(max),
@p_categoryid int,
@p_pointsvalue int,
@p_assigneduserid int,
@p_duedate datetime2(6)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        UPDATE tasks SET
            title = @p_title,
            description = @p_description,
            categoryid = @p_categoryid,
            pointsvalue = @p_pointsvalue,
            assigneduserid = @p_assigneduserid,
            duedate = @p_duedate
        WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_update_task_status
@p_id int,
@p_status nvarchar(max),
@p_completedat datetime2(6)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
UPDATE tasks SET status = @p_status, completedat = CASE WHEN @p_status = N'Done' THEN COALESCE(@p_completedat, SYSUTCDATETIME()) ELSE NULL END WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_update_task_sub_item
@p_id int,
@p_itemtext nvarchar(max),
@p_iscompleted bit
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

        UPDATE tasksubitems SET itemtext = @p_itemtext, iscompleted = @p_iscompleted
        WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_update_user
@p_id int,
@p_fullname nvarchar(max),
@p_avatarstate nvarchar(max),
@p_familyrole nvarchar(max)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
UPDATE users SET fullname = @p_fullname, avatarstate = COALESCE(@p_avatarstate, avatarstate), familyrole = COALESCE(@p_familyrole, familyrole) WHERE id = @p_id; SELECT @@ROWCOUNT;
END;
GO

CREATE OR ALTER PROCEDURE dbo.neondb_stp_claim_reward_atomic
@p_id int,@p_userid int,@p_householdid int
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;
DECLARE @locked int,@cost int,@threshold int,@claimed int,@xp bigint,@balance bigint;
SELECT @locked=userid FROM dbo.householdmembers WITH (UPDLOCK,HOLDLOCK) WHERE householdid=@p_householdid AND userid=@p_userid;
IF @locked IS NULL BEGIN COMMIT; SELECT 0; RETURN; END;
SELECT @cost=cost,@threshold=requiredpoints,@claimed=claimedbyuserid FROM dbo.rewards WITH (UPDLOCK,HOLDLOCK) WHERE id=@p_id AND householdid=@p_householdid;
SELECT @balance=COALESCE(SUM(CONVERT(bigint,pointsearned)),0),@xp=COALESCE(SUM(CASE WHEN pointsearned>0 THEN CONVERT(bigint,pointsearned) ELSE 0 END),0) FROM dbo.pointsleader WHERE householdid=@p_householdid AND userid=@p_userid;
IF @cost IS NULL OR @cost<0 OR @claimed IS NOT NULL OR @balance<@cost OR @xp<@threshold
BEGIN COMMIT; SELECT 0; RETURN; END;
IF @cost>0 INSERT INTO dbo.pointsleader(householdid,userid,taskid,rewardid,pointsearned) VALUES(@p_householdid,@p_userid,NULL,@p_id,-@cost);
UPDATE dbo.rewards SET claimedbyuserid=@p_userid WHERE id=@p_id;
COMMIT;
SELECT 1;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK;
THROW;
END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.neondb_stp_register_atomic
@p_fullname nvarchar(max),@p_email nvarchar(max),@p_passwordhash nvarchar(max),@p_familyrole nvarchar(max),
@p_householdname nvarchar(max),@p_role nvarchar(max),@p_tokenhash nvarchar(max),@p_expiresat datetime2(6)
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;
INSERT INTO dbo.users(fullname,email,passwordhash,familyrole) VALUES(@p_fullname,@p_email,@p_passwordhash,COALESCE(@p_familyrole,N'roommate'));
DECLARE @uid int=CONVERT(int,SCOPE_IDENTITY());
INSERT INTO dbo.householdinfo(name,adminuserid) VALUES(@p_householdname,@uid);
DECLARE @hid int=CONVERT(int,SCOPE_IDENTITY());
INSERT INTO dbo.householdmembers(householdid,userid,role) VALUES(@hid,@uid,@p_role);
INSERT INTO dbo.sessions(userid,tokenhash,expiresat) VALUES(@uid,@p_tokenhash,@p_expiresat);
DECLARE @sid int=CONVERT(int,SCOPE_IDENTITY());
COMMIT;
SELECT * FROM dbo.users WHERE id=@uid;
SELECT * FROM dbo.householdinfo WHERE id=@hid;
SELECT * FROM dbo.sessions WHERE id=@sid;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK;
THROW;
END CATCH;
END;
GO
