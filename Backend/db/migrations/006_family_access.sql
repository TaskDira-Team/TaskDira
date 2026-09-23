BEGIN;
CREATE TABLE IF NOT EXISTS managedprofiles (
 userid int PRIMARY KEY REFERENCES users(id), householdid int NOT NULL REFERENCES householdinfo(id),
 guardianid int NOT NULL REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS familyinvitations (
 id varchar(32) PRIMARY KEY, householdid int NOT NULL REFERENCES householdinfo(id), creatorid int NOT NULL REFERENCES users(id),
 tokenhash varchar(64) NOT NULL UNIQUE, createdat timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
 expiresat timestamp NOT NULL, revoked boolean NOT NULL DEFAULT false, acceptedby int REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS familypairings (
 secrethash varchar(64) PRIMARY KEY, codehash varchar(64) NOT NULL UNIQUE, expiresat timestamp NOT NULL,
 childid int REFERENCES users(id), approvedby int REFERENCES users(id), consumed boolean NOT NULL DEFAULT false
);
CREATE OR REPLACE FUNCTION neondb_stp_family_access(p_action text, p_data text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
 d jsonb := p_data::jsonb; c int := (d->>'caller')::int; h int := (d->>'household')::int;
 child int := (d->>'child')::int; target int := (d->>'target')::int;
 inv familyinvitations%ROWTYPE; pairing familypairings%ROWTYPE; u int; expiry timestamp;
 clock timestamp := now() AT TIME ZONE 'UTC'; result jsonb;
BEGIN
 IF p_action = 'context' THEN
   RETURN jsonb_build_object('isManagedProfile',EXISTS(SELECT 1 FROM managedprofiles WHERE userid=target),
     'active',EXISTS(SELECT 1 FROM managedprofiles p JOIN householdmembers m ON m.userid=p.userid AND m.householdid=p.householdid WHERE p.userid=target AND lower(m.role)='member'),
     'canRead',c=target OR EXISTS(SELECT 1 FROM householdmembers a JOIN householdmembers b USING(householdid) WHERE a.userid=c AND b.userid=target))::text;
 END IF;
 IF p_action IN ('list','invite','revoke','child','switch','approve') THEN
   IF EXISTS(SELECT 1 FROM managedprofiles WHERE userid=c) OR NOT EXISTS(SELECT 1 FROM householdmembers WHERE userid=c AND householdid=h AND lower(role)='admin') THEN
     RETURN '{"error":"forbidden"}';
   END IF;
 END IF;
 IF p_action = 'list' THEN
   SELECT jsonb_build_object('children',coalesce((SELECT jsonb_agg(x) FROM (SELECT p.userid AS "userId",u.fullname AS "fullName",u.avatarstate AS "avatarState" FROM managedprofiles p JOIN users u ON u.id=p.userid JOIN householdmembers m ON m.userid=p.userid AND m.householdid=p.householdid WHERE p.householdid=h ORDER BY p.userid LIMIT 100) x),'[]'::jsonb),
     'invitations',coalesce((SELECT jsonb_agg(x) FROM (SELECT id,createdat AS "createdAt",expiresat AS "expiresAt", CASE WHEN revoked THEN 'revoked' WHEN acceptedby IS NOT NULL THEN 'accepted' WHEN expiresat<=clock THEN 'expired' ELSE 'pending' END AS status FROM familyinvitations WHERE householdid=h ORDER BY createdat DESC LIMIT 50) x),'[]'::jsonb)) INTO result;
   RETURN result::text;
 ELSIF p_action = 'invite' THEN
   IF (SELECT count(*) FROM familyinvitations WHERE householdid=h AND NOT revoked AND acceptedby IS NULL AND expiresat>clock)>=50 THEN RETURN '{"error":"Revoke an unused invitation before creating another."}'; END IF;
   INSERT INTO familyinvitations(id,householdid,creatorid,tokenhash,expiresat) VALUES(d->>'id',h,c,d->>'hash',clock+interval '7 days');
   RETURN jsonb_build_object('id',d->>'id','expiresAt',clock+interval '7 days','status','pending')::text;
 ELSIF p_action = 'revoke' THEN
   UPDATE familyinvitations SET revoked=true WHERE id=d->>'id' AND householdid=h AND acceptedby IS NULL;
   RETURN '{}';
 ELSIF p_action IN ('preview','accept','join') THEN
   SELECT * INTO inv FROM familyinvitations WHERE tokenhash=d->>'hash' FOR UPDATE;
   IF inv.id IS NULL OR inv.revoked OR inv.acceptedby IS NOT NULL OR inv.expiresat<=clock OR NOT EXISTS(SELECT 1 FROM householdmembers WHERE userid=inv.creatorid AND householdid=inv.householdid AND lower(role)='admin') THEN
     RETURN '{"error":"This invitation has expired, was used, or was cancelled. Ask your host for a new link."}';
   END IF;
   IF p_action='preview' THEN RETURN (SELECT jsonb_build_object('householdName',name,'expiresAt',inv.expiresat)::text FROM householdinfo WHERE id=inv.householdid); END IF;
   IF p_action='accept' THEN
     IF c IS NULL OR EXISTS(SELECT 1 FROM managedprofiles WHERE userid=c) THEN RETURN '{"error":"forbidden"}'; END IF;
     IF EXISTS(SELECT 1 FROM householdmembers WHERE userid=c AND householdid=inv.householdid) THEN RETURN '{"error":"You already belong to this home."}'; END IF;
     u:=c;
   ELSE
     IF EXISTS(SELECT 1 FROM users WHERE lower(email)=lower(d->>'email')) THEN RETURN '{"error":"This email already has an account. Sign in to accept the invitation."}'; END IF;
     INSERT INTO users(fullname,email,passwordhash,familyrole) VALUES(d->>'fullname',d->>'email',d->>'passwordHash','adult') RETURNING id INTO u;
   END IF;
   INSERT INTO householdmembers(householdid,userid,role) VALUES(inv.householdid,u,'Member');
   UPDATE familyinvitations SET acceptedby=u WHERE id=inv.id;
   expiry:=clock+interval '30 days';
   IF p_action='join' THEN INSERT INTO sessions(userid,tokenhash,expiresat) VALUES(u,d->>'sessionHash',expiry); END IF;
   RETURN jsonb_build_object('userId',u,'householdId',inv.householdid,'expiresAt',expiry)::text;
 ELSIF p_action='child' THEN
   IF (SELECT count(*) FROM managedprofiles WHERE householdid=h)>=100 THEN RETURN '{"error":"This home has reached its child profile limit."}'; END IF;
   INSERT INTO users(fullname,email,passwordhash,avatarstate,familyrole) VALUES(d->>'fullname',d->>'email',d->>'passwordHash',(d->>'avatar')::jsonb,'kid') RETURNING id INTO u;
   INSERT INTO householdmembers(householdid,userid,role) VALUES(h,u,'Member');
   INSERT INTO managedprofiles(userid,householdid,guardianid) VALUES(u,h,c);
   RETURN jsonb_build_object('userId',u)::text;
 ELSIF p_action IN ('switch','approve') THEN
   IF NOT EXISTS(SELECT 1 FROM managedprofiles p JOIN householdmembers m ON m.userid=p.userid AND m.householdid=p.householdid WHERE p.userid=child AND p.householdid=h AND lower(m.role)='member') THEN RETURN '{"error":"Choose a child in this home."}'; END IF;
   IF p_action='approve' THEN
     UPDATE familypairings SET childid=child,approvedby=c WHERE codehash=d->>'codeHash' AND expiresat>clock AND childid IS NULL AND NOT consumed;
     IF NOT FOUND THEN RETURN '{"error":"This code has expired or was already approved. Create a new code on the child device."}'; END IF;
     RETURN '{}';
   END IF;
   DELETE FROM sessions WHERE userid=c AND tokenhash=d->>'oldHash';
   IF NOT FOUND THEN RETURN '{"error":"Sign in again before switching players."}'; END IF;
   expiry:=clock+interval '8 hours';
   INSERT INTO sessions(userid,tokenhash,expiresat) VALUES(child,d->>'sessionHash',expiry);
   RETURN jsonb_build_object('userId',child,'householdId',h,'expiresAt',expiry)::text;
 ELSIF p_action='pair' THEN
   DELETE FROM familypairings WHERE expiresat<clock;
   INSERT INTO familypairings(secrethash,codehash,expiresat) VALUES(d->>'hash',d->>'codeHash',clock+interval '10 minutes');
   RETURN '{}';
 ELSIF p_action='poll' THEN
   SELECT * INTO pairing FROM familypairings WHERE secrethash=d->>'hash' FOR UPDATE;
   IF pairing.secrethash IS NULL OR pairing.expiresat<=clock OR pairing.consumed THEN RETURN '{"error":"This pairing has ended. Create a new code."}'; END IF;
   IF pairing.childid IS NULL THEN RETURN '{"pending":true}'; END IF;
   SELECT p.householdid INTO h FROM managedprofiles p JOIN householdmembers m ON m.userid=p.userid AND m.householdid=p.householdid WHERE p.userid=pairing.childid AND lower(m.role)='member';
   IF h IS NULL OR NOT EXISTS(SELECT 1 FROM householdmembers WHERE householdid=h AND userid=pairing.approvedby AND lower(role)='admin') THEN RETURN '{"error":"A parent must approve a new code."}'; END IF;
   UPDATE familypairings SET consumed=true WHERE secrethash=pairing.secrethash;
   expiry:=clock+interval '8 hours';
   INSERT INTO sessions(userid,tokenhash,expiresat) VALUES(pairing.childid,d->>'sessionHash',expiry);
   RETURN jsonb_build_object('userId',pairing.childid,'householdId',h,'expiresAt',expiry)::text;
 END IF;
 RETURN '{"error":"Unknown family action."}';
EXCEPTION WHEN unique_violation THEN RETURN '{"error":"This request was already completed. Refresh and try again."}';
END;
$$;
COMMIT;
