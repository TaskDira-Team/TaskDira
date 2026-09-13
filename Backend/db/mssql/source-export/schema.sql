CREATE SCHEMA IF NOT EXISTS public;
CREATE SEQUENCE public.categories_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public.householdinfo_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public.monthlyleaderboard_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public.pointsledger_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public.rewards_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public.sessions_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public.tasks_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public.tasksubitems_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public.users_id_seq AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;
CREATE TABLE public.categories (
    "id" integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
    "name" character varying(150) NOT NULL,
    "description" text NULL
);
ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
CREATE TABLE public.householdinfo (
    "id" integer NOT NULL DEFAULT nextval('householdinfo_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "adminuserid" integer NOT NULL,
    "createdat" timestamp without time zone NULL DEFAULT now(),
    "address" character varying(200) NULL,
    "monthlygoalpoints" integer NOT NULL DEFAULT 400,
    "requireproofapproval" boolean NOT NULL DEFAULT false
);
ALTER SEQUENCE public.householdinfo_id_seq OWNED BY public.householdinfo.id;
CREATE TABLE public.householdmembers (
    "householdid" integer NOT NULL,
    "userid" integer NOT NULL,
    "role" character varying(30) NOT NULL,
    "joinedat" timestamp without time zone NULL DEFAULT now()
);
CREATE TABLE public.monthlyleaderboard (
    "id" integer NOT NULL DEFAULT nextval('monthlyleaderboard_id_seq'::regclass),
    "householdid" integer NOT NULL,
    "userid" integer NOT NULL,
    "month" integer NOT NULL,
    "year" integer NOT NULL,
    "totalpoints" integer NOT NULL DEFAULT 0,
    "rank" integer NULL
);
ALTER SEQUENCE public.monthlyleaderboard_id_seq OWNED BY public.monthlyleaderboard.id;
CREATE TABLE public.pointsleader (
    "id" integer NOT NULL DEFAULT nextval('pointsledger_id_seq'::regclass),
    "userid" integer NOT NULL,
    "taskid" integer NULL,
    "pointsearned" integer NOT NULL,
    "earnedat" timestamp without time zone NULL DEFAULT now(),
    "rewardid" integer NULL,
    "householdid" integer NOT NULL
);
ALTER SEQUENCE public.pointsledger_id_seq OWNED BY public.pointsleader.id;
CREATE TABLE public.rewards (
    "id" integer NOT NULL DEFAULT nextval('rewards_id_seq'::regclass),
    "title" character varying(150) NOT NULL,
    "requiredpoints" integer NOT NULL,
    "claimedbyuserid" integer NULL,
    "householdid" integer NULL,
    "emoji" character varying(16) NULL,
    "description" text NULL,
    "cost" integer NOT NULL DEFAULT 0,
    "category" character varying(30) NULL
);
ALTER SEQUENCE public.rewards_id_seq OWNED BY public.rewards.id;
CREATE TABLE public.sessions (
    "id" integer NOT NULL DEFAULT nextval('sessions_id_seq'::regclass),
    "userid" integer NOT NULL,
    "tokenhash" text NOT NULL,
    "createdat" timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "expiresat" timestamp without time zone NOT NULL
);
ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;
CREATE TABLE public.tasks (
    "id" integer NOT NULL DEFAULT nextval('tasks_id_seq'::regclass),
    "householdid" integer NOT NULL,
    "title" character varying(150) NOT NULL,
    "description" text NULL,
    "categoryid" integer NULL,
    "pointsvalue" integer NOT NULL DEFAULT 0,
    "assigneduserid" integer NULL,
    "status" character varying(20) NOT NULL DEFAULT 'ToDo'::character varying,
    "duedate" timestamp without time zone NULL,
    "proofimageurl" character varying(255) NULL,
    "createdbyid" integer NULL,
    "completedat" timestamp without time zone NULL,
    "approvedbyid" integer NULL,
    "rejectedreason" text NULL
);
ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;
CREATE TABLE public.tasksubitems (
    "id" integer NOT NULL DEFAULT nextval('tasksubitems_id_seq'::regclass),
    "taskid" integer NOT NULL,
    "itemtext" character varying(150) NOT NULL,
    "iscompleted" boolean NOT NULL DEFAULT false
);
ALTER SEQUENCE public.tasksubitems_id_seq OWNED BY public.tasksubitems.id;
CREATE TABLE public.users (
    "id" integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    "fullname" character varying(100) NOT NULL,
    "email" character varying(150) NOT NULL,
    "passwordhash" character varying(255) NOT NULL,
    "avatarstate" jsonb NULL DEFAULT '"neutral"'::jsonb,
    "createdat" timestamp without time zone NULL DEFAULT now(),
    "familyrole" character varying(30) NOT NULL DEFAULT 'roommate'::character varying
);
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE public.householdinfo ADD CONSTRAINT householdinfo_pkey PRIMARY KEY (id);
ALTER TABLE public.householdmembers ADD CONSTRAINT householdmembers_pkey PRIMARY KEY (householdid, userid);
ALTER TABLE public.monthlyleaderboard ADD CONSTRAINT monthlyleaderboard_pkey PRIMARY KEY (id);
ALTER TABLE public.pointsleader ADD CONSTRAINT pointsleader_pointsearned_nonzero CHECK (pointsearned <> 0);
ALTER TABLE public.pointsleader ADD CONSTRAINT pointsleader_task_or_reward CHECK (taskid IS NOT NULL OR rewardid IS NOT NULL);
ALTER TABLE public.pointsleader ADD CONSTRAINT pointsledger_pkey PRIMARY KEY (id);
ALTER TABLE public.rewards ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);
ALTER TABLE public.sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.sessions ADD CONSTRAINT sessions_tokenhash_key UNIQUE (tokenhash);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.tasksubitems ADD CONSTRAINT tasksubitems_pkey PRIMARY KEY (id);
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.householdinfo ADD CONSTRAINT householdinfo_adminuserid_fkey FOREIGN KEY (adminuserid) REFERENCES users(id);
ALTER TABLE public.householdmembers ADD CONSTRAINT householdmembers_householdid_fkey FOREIGN KEY (householdid) REFERENCES householdinfo(id);
ALTER TABLE public.householdmembers ADD CONSTRAINT householdmembers_userid_fkey FOREIGN KEY (userid) REFERENCES users(id);
ALTER TABLE public.monthlyleaderboard ADD CONSTRAINT monthlyleaderboard_householdid_fkey FOREIGN KEY (householdid) REFERENCES householdinfo(id);
ALTER TABLE public.monthlyleaderboard ADD CONSTRAINT monthlyleaderboard_userid_fkey FOREIGN KEY (userid) REFERENCES users(id);
ALTER TABLE public.pointsleader ADD CONSTRAINT pointsleader_householdid_fkey FOREIGN KEY (householdid) REFERENCES householdinfo(id);
ALTER TABLE public.pointsleader ADD CONSTRAINT pointsleader_rewardid_fkey FOREIGN KEY (rewardid) REFERENCES rewards(id);
ALTER TABLE public.pointsleader ADD CONSTRAINT pointsledger_taskid_fkey FOREIGN KEY (taskid) REFERENCES tasks(id);
ALTER TABLE public.pointsleader ADD CONSTRAINT pointsledger_userid_fkey FOREIGN KEY (userid) REFERENCES users(id);
ALTER TABLE public.rewards ADD CONSTRAINT rewards_claimedbyuserid_fkey FOREIGN KEY (claimedbyuserid) REFERENCES users(id);
ALTER TABLE public.rewards ADD CONSTRAINT rewards_householdid_fkey FOREIGN KEY (householdid) REFERENCES householdinfo(id);
ALTER TABLE public.sessions ADD CONSTRAINT sessions_userid_fkey FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_approvedbyid_fkey FOREIGN KEY (approvedbyid) REFERENCES users(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigneduserid_fkey FOREIGN KEY (assigneduserid) REFERENCES users(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_categoryid_fkey FOREIGN KEY (categoryid) REFERENCES categories(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_createdbyid_fkey FOREIGN KEY (createdbyid) REFERENCES users(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_householdid_fkey FOREIGN KEY (householdid) REFERENCES householdinfo(id);
ALTER TABLE public.tasksubitems ADD CONSTRAINT tasksubitems_taskid_fkey FOREIGN KEY (taskid) REFERENCES tasks(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX ux_pointsleader_task_earn ON public.pointsleader USING btree (taskid) WHERE (pointsearned > 0);
CREATE INDEX idx_sessions_userid ON public.sessions USING btree (userid);
