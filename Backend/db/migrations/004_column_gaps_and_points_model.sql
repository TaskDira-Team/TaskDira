BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS familyrole varchar(30) NOT NULL DEFAULT 'roommate';

CREATE OR REPLACE FUNCTION neondb_stp_tmp_try_jsonb(p_text text) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN RETURN p_text::jsonb; EXCEPTION WHEN others THEN RETURN to_jsonb(p_text); END; $$;

ALTER TABLE users ALTER COLUMN avatarstate DROP DEFAULT;

ALTER TABLE users ALTER COLUMN avatarstate TYPE jsonb USING (CASE WHEN avatarstate IS NULL THEN NULL ELSE neondb_stp_tmp_try_jsonb(avatarstate) END);

ALTER TABLE users ALTER COLUMN avatarstate SET DEFAULT '"neutral"'::jsonb;

DROP FUNCTION IF EXISTS neondb_stp_tmp_try_jsonb(text);

ALTER TABLE householdinfo ADD COLUMN IF NOT EXISTS address varchar(200);

ALTER TABLE householdinfo ADD COLUMN IF NOT EXISTS monthlygoalpoints integer NOT NULL DEFAULT 400;

ALTER TABLE householdinfo ADD COLUMN IF NOT EXISTS requireproofapproval boolean NOT NULL DEFAULT false;

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS emoji varchar(16);

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS cost integer NOT NULL DEFAULT 0;

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS category varchar(30);

UPDATE rewards SET cost = requiredpoints WHERE cost = 0;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS createdbyid integer REFERENCES users(id);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completedat timestamp;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approvedbyid integer REFERENCES users(id);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rejectedreason text;

ALTER TABLE pointsleader ADD COLUMN IF NOT EXISTS rewardid integer REFERENCES rewards(id);

ALTER TABLE pointsleader ADD COLUMN IF NOT EXISTS householdid integer;

UPDATE pointsleader pl SET householdid = t.householdid FROM tasks t WHERE t.id = pl.taskid AND pl.householdid IS NULL;

DELETE FROM pointsleader WHERE householdid IS NULL;

ALTER TABLE pointsleader ALTER COLUMN householdid SET NOT NULL;

ALTER TABLE pointsleader ALTER COLUMN taskid DROP NOT NULL;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pointsleader_householdid_fkey') THEN ALTER TABLE pointsleader ADD CONSTRAINT pointsleader_householdid_fkey FOREIGN KEY (householdid) REFERENCES householdinfo(id); END IF; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_pointsleader_task_earn ON pointsleader (taskid) WHERE pointsearned > 0;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pointsleader_pointsearned_nonzero') THEN ALTER TABLE pointsleader ADD CONSTRAINT pointsleader_pointsearned_nonzero CHECK (pointsearned <> 0); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pointsleader_task_or_reward') THEN ALTER TABLE pointsleader ADD CONSTRAINT pointsleader_task_or_reward CHECK (taskid IS NOT NULL OR rewardid IS NOT NULL); END IF; END $$;

COMMIT;
