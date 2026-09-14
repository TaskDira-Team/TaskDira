SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
CREATE TABLE dbo.[categories] (
    [id] int IDENTITY(1,1) NOT NULL,
    [name] nvarchar(300) NOT NULL,
    CONSTRAINT [ck_categories_name_length] CHECK (LEN(([name]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 150),
    [description] nvarchar(max) NULL
);
CREATE TABLE dbo.[householdinfo] (
    [id] int IDENTITY(1,1) NOT NULL,
    [name] nvarchar(200) NOT NULL,
    CONSTRAINT [ck_householdinfo_name_length] CHECK (LEN(([name]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 100),
    [adminuserid] int NOT NULL,
    [createdat] datetime2(6) NULL CONSTRAINT [df_householdinfo_createdat] DEFAULT (SYSUTCDATETIME()),
    [address] nvarchar(400) NULL,
    CONSTRAINT [ck_householdinfo_address_length] CHECK (LEN(([address]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 200),
    [monthlygoalpoints] int NOT NULL CONSTRAINT [df_householdinfo_monthlygoalpoints] DEFAULT (400),
    [requireproofapproval] bit NOT NULL CONSTRAINT [df_householdinfo_requireproofapproval] DEFAULT (0)
);
CREATE TABLE dbo.[householdmembers] (
    [householdid] int NOT NULL,
    [userid] int NOT NULL,
    [role] nvarchar(60) NOT NULL,
    CONSTRAINT [ck_householdmembers_role_length] CHECK (LEN(([role]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 30),
    [joinedat] datetime2(6) NULL CONSTRAINT [df_householdmembers_joinedat] DEFAULT (SYSUTCDATETIME())
);
CREATE TABLE dbo.[monthlyleaderboard] (
    [id] int IDENTITY(1,1) NOT NULL,
    [householdid] int NOT NULL,
    [userid] int NOT NULL,
    [month] int NOT NULL,
    [year] int NOT NULL,
    [totalpoints] int NOT NULL CONSTRAINT [df_monthlyleaderboard_totalpoints] DEFAULT (0),
    [rank] int NULL
);
CREATE TABLE dbo.[pointsleader] (
    [id] int IDENTITY(1,1) NOT NULL,
    [userid] int NOT NULL,
    [taskid] int NULL,
    [pointsearned] int NOT NULL,
    [earnedat] datetime2(6) NULL CONSTRAINT [df_pointsleader_earnedat] DEFAULT (SYSUTCDATETIME()),
    [rewardid] int NULL,
    [householdid] int NOT NULL
);
CREATE TABLE dbo.[rewards] (
    [id] int IDENTITY(1,1) NOT NULL,
    [title] nvarchar(300) NOT NULL,
    CONSTRAINT [ck_rewards_title_length] CHECK (LEN(([title]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 150),
    [requiredpoints] int NOT NULL,
    [claimedbyuserid] int NULL,
    [householdid] int NULL,
    [emoji] nvarchar(32) NULL,
    CONSTRAINT [ck_rewards_emoji_length] CHECK (LEN(([emoji]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 16),
    [description] nvarchar(max) NULL,
    [cost] int NOT NULL CONSTRAINT [df_rewards_cost] DEFAULT (0),
    [category] nvarchar(60) NULL,
    CONSTRAINT [ck_rewards_category_length] CHECK (LEN(([category]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 30)
);
CREATE TABLE dbo.[sessions] (
    [id] int IDENTITY(1,1) NOT NULL,
    [userid] int NOT NULL,
    [tokenhash] nvarchar(450) NOT NULL,
    [createdat] datetime2(6) NOT NULL CONSTRAINT [df_sessions_createdat] DEFAULT ((SYSUTCDATETIME())),
    [expiresat] datetime2(6) NOT NULL,
    tokenhashbytes AS DATALENGTH(tokenhash) PERSISTED
);
CREATE TABLE dbo.[tasks] (
    [id] int IDENTITY(1,1) NOT NULL,
    [householdid] int NOT NULL,
    [title] nvarchar(300) NOT NULL,
    CONSTRAINT [ck_tasks_title_length] CHECK (LEN(([title]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 150),
    [description] nvarchar(max) NULL,
    [categoryid] int NULL,
    [pointsvalue] int NOT NULL CONSTRAINT [df_tasks_pointsvalue] DEFAULT (0),
    [assigneduserid] int NULL,
    [status] nvarchar(40) NOT NULL CONSTRAINT [df_tasks_status] DEFAULT (N'ToDo'),
    CONSTRAINT [ck_tasks_status_length] CHECK (LEN(([status]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 20),
    [duedate] datetime2(6) NULL,
    [proofimageurl] nvarchar(510) NULL,
    CONSTRAINT [ck_tasks_proofimageurl_length] CHECK (LEN(([proofimageurl]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 255),
    [createdbyid] int NULL,
    [completedat] datetime2(6) NULL,
    [approvedbyid] int NULL,
    [rejectedreason] nvarchar(max) NULL
);
CREATE TABLE dbo.[tasksubitems] (
    [id] int IDENTITY(1,1) NOT NULL,
    [taskid] int NOT NULL,
    [itemtext] nvarchar(300) NOT NULL,
    CONSTRAINT [ck_tasksubitems_itemtext_length] CHECK (LEN(([itemtext]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 150),
    [iscompleted] bit NOT NULL CONSTRAINT [df_tasksubitems_iscompleted] DEFAULT (0)
);
CREATE TABLE dbo.[users] (
    [id] int IDENTITY(1,1) NOT NULL,
    [fullname] nvarchar(200) NOT NULL,
    CONSTRAINT [ck_users_fullname_length] CHECK (LEN(([fullname]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 100),
    [email] nvarchar(300) NOT NULL,
    CONSTRAINT [ck_users_email_length] CHECK (LEN(([email]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 150),
    [passwordhash] nvarchar(510) NOT NULL,
    CONSTRAINT [ck_users_passwordhash_length] CHECK (LEN(([passwordhash]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 255),
    [avatarstate] nvarchar(max) NULL CONSTRAINT [df_users_avatarstate] DEFAULT (N'"neutral"'),
    CONSTRAINT [ck_users_avatarstate_json] CHECK (ISJSON([avatarstate], VALUE)=1),
    [createdat] datetime2(6) NULL CONSTRAINT [df_users_createdat] DEFAULT (SYSUTCDATETIME()),
    [familyrole] nvarchar(60) NOT NULL CONSTRAINT [df_users_familyrole] DEFAULT (N'roommate'),
    CONSTRAINT [ck_users_familyrole_length] CHECK (LEN(([familyrole]+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= 30),
    emailbytes AS DATALENGTH(email) PERSISTED
);
ALTER TABLE dbo.[categories] ADD CONSTRAINT [categories_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[householdinfo] ADD CONSTRAINT [householdinfo_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[householdmembers] ADD CONSTRAINT [householdmembers_pkey] PRIMARY KEY (householdid, userid);
ALTER TABLE dbo.[monthlyleaderboard] ADD CONSTRAINT [monthlyleaderboard_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[pointsleader] ADD CONSTRAINT [pointsleader_pointsearned_nonzero] CHECK (pointsearned <> 0);
ALTER TABLE dbo.[pointsleader] ADD CONSTRAINT [pointsleader_task_or_reward] CHECK (taskid IS NOT NULL OR rewardid IS NOT NULL);
ALTER TABLE dbo.[pointsleader] ADD CONSTRAINT [pointsledger_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[rewards] ADD CONSTRAINT [rewards_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[sessions] ADD CONSTRAINT [sessions_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[sessions] ADD CONSTRAINT [sessions_tokenhash_key] UNIQUE (tokenhash,tokenhashbytes);
ALTER TABLE dbo.[tasks] ADD CONSTRAINT [tasks_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[tasksubitems] ADD CONSTRAINT [tasksubitems_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[users] ADD CONSTRAINT [users_email_key] UNIQUE (email,emailbytes);
ALTER TABLE dbo.[users] ADD CONSTRAINT [users_pkey] PRIMARY KEY (id);
ALTER TABLE dbo.[householdinfo] ADD CONSTRAINT [householdinfo_adminuserid_fkey] FOREIGN KEY (adminuserid) REFERENCES dbo.users(id);
ALTER TABLE dbo.[householdmembers] ADD CONSTRAINT [householdmembers_householdid_fkey] FOREIGN KEY (householdid) REFERENCES dbo.householdinfo(id);
ALTER TABLE dbo.[householdmembers] ADD CONSTRAINT [householdmembers_userid_fkey] FOREIGN KEY (userid) REFERENCES dbo.users(id);
ALTER TABLE dbo.[monthlyleaderboard] ADD CONSTRAINT [monthlyleaderboard_householdid_fkey] FOREIGN KEY (householdid) REFERENCES dbo.householdinfo(id);
ALTER TABLE dbo.[monthlyleaderboard] ADD CONSTRAINT [monthlyleaderboard_userid_fkey] FOREIGN KEY (userid) REFERENCES dbo.users(id);
ALTER TABLE dbo.[pointsleader] ADD CONSTRAINT [pointsleader_householdid_fkey] FOREIGN KEY (householdid) REFERENCES dbo.householdinfo(id);
ALTER TABLE dbo.[pointsleader] ADD CONSTRAINT [pointsleader_rewardid_fkey] FOREIGN KEY (rewardid) REFERENCES dbo.rewards(id);
ALTER TABLE dbo.[pointsleader] ADD CONSTRAINT [pointsledger_taskid_fkey] FOREIGN KEY (taskid) REFERENCES dbo.tasks(id);
ALTER TABLE dbo.[pointsleader] ADD CONSTRAINT [pointsledger_userid_fkey] FOREIGN KEY (userid) REFERENCES dbo.users(id);
ALTER TABLE dbo.[rewards] ADD CONSTRAINT [rewards_claimedbyuserid_fkey] FOREIGN KEY (claimedbyuserid) REFERENCES dbo.users(id);
ALTER TABLE dbo.[rewards] ADD CONSTRAINT [rewards_householdid_fkey] FOREIGN KEY (householdid) REFERENCES dbo.householdinfo(id);
ALTER TABLE dbo.[sessions] ADD CONSTRAINT [sessions_userid_fkey] FOREIGN KEY (userid) REFERENCES dbo.users(id) ON DELETE CASCADE;
ALTER TABLE dbo.[tasks] ADD CONSTRAINT [tasks_approvedbyid_fkey] FOREIGN KEY (approvedbyid) REFERENCES dbo.users(id);
ALTER TABLE dbo.[tasks] ADD CONSTRAINT [tasks_assigneduserid_fkey] FOREIGN KEY (assigneduserid) REFERENCES dbo.users(id);
ALTER TABLE dbo.[tasks] ADD CONSTRAINT [tasks_categoryid_fkey] FOREIGN KEY (categoryid) REFERENCES dbo.categories(id);
ALTER TABLE dbo.[tasks] ADD CONSTRAINT [tasks_createdbyid_fkey] FOREIGN KEY (createdbyid) REFERENCES dbo.users(id);
ALTER TABLE dbo.[tasks] ADD CONSTRAINT [tasks_householdid_fkey] FOREIGN KEY (householdid) REFERENCES dbo.householdinfo(id);
ALTER TABLE dbo.[tasksubitems] ADD CONSTRAINT [tasksubitems_taskid_fkey] FOREIGN KEY (taskid) REFERENCES dbo.tasks(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX ux_pointsleader_task_earn ON dbo.pointsleader (taskid) WHERE (pointsearned > 0) AND taskid IS NOT NULL;
CREATE INDEX idx_sessions_userid ON dbo.sessions (userid);
CREATE INDEX ix_pointsleader_wallet ON dbo.pointsleader(householdid,userid) INCLUDE(pointsearned);
