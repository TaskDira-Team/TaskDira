CREATE TABLE IF NOT EXISTS sessions (
    id        SERIAL PRIMARY KEY,
    userid    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tokenhash text NOT NULL UNIQUE,
    createdat timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    expiresat timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_userid ON sessions(userid);

CREATE OR REPLACE FUNCTION neondb_stp_insert_session(p_userid integer, p_tokenhash text, p_expiresat timestamp)
RETURNS SETOF sessions LANGUAGE sql AS $$
    INSERT INTO sessions (userid, tokenhash, expiresat)
    VALUES (p_userid, p_tokenhash, p_expiresat)
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_get_session_by_token_hash(p_tokenhash text)
RETURNS SETOF sessions LANGUAGE sql AS $$
    SELECT * FROM sessions WHERE tokenhash = p_tokenhash;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_session_by_token_hash(p_tokenhash text)
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (DELETE FROM sessions WHERE tokenhash = p_tokenhash RETURNING id)
    SELECT COUNT(*)::integer FROM deleted;
$$;

CREATE OR REPLACE FUNCTION neondb_stp_delete_expired_sessions()
RETURNS integer LANGUAGE sql AS $$
    WITH deleted AS (DELETE FROM sessions WHERE expiresat <= (now() AT TIME ZONE 'utc') RETURNING id)
    SELECT COUNT(*)::integer FROM deleted;
$$;
