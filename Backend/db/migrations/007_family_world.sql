-- Apply after 006. Credits are a snapshot of distinct completed tasks seen by the
-- world, not currency. They survive reopening/deleting tasks and cannot be spent.
CREATE TABLE IF NOT EXISTS familyworldcredits (
 householdid int NOT NULL REFERENCES householdinfo(id) ON DELETE CASCADE,
 taskid int NOT NULL, PRIMARY KEY(householdid,taskid));
CREATE TABLE IF NOT EXISTS familyworldplacements (
 householdid int NOT NULL REFERENCES householdinfo(id) ON DELETE CASCADE,
 piece text NOT NULL, position text NOT NULL, PRIMARY KEY(householdid,piece));
CREATE TABLE IF NOT EXISTS familyworldsupport (
 householdid int NOT NULL REFERENCES householdinfo(id) ON DELETE CASCADE,
 userid int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 skill text NOT NULL, level text NOT NULL, PRIMARY KEY(householdid,userid,skill));

CREATE OR REPLACE FUNCTION neondb_stp_family_world(p_action text,p_data text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE d jsonb:=p_data::jsonb; h int:=(d->>'household')::int; c int:=(d->>'caller')::int;
 n int; required int; target int:=(d->>'target')::int; admin boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM householdmembers WHERE householdid=h AND userid=c) THEN RETURN '{"error":"forbidden"}'; END IF;
 admin:=NOT EXISTS(SELECT 1 FROM managedprofiles WHERE userid=c) AND EXISTS(SELECT 1 FROM householdmembers WHERE householdid=h AND userid=c AND lower(role)='admin');
 IF p_action NOT IN ('read','place','support') THEN RETURN '{"error":"Unknown world action."}'; END IF;
 -- Materialize completed-task progress idempotently; pending tasks never count.
 INSERT INTO familyworldcredits(householdid,taskid)
 SELECT h,id FROM tasks WHERE householdid=h AND lower(status)='done' ON CONFLICT DO NOTHING;
 SELECT count(*) INTO n FROM familyworldcredits WHERE householdid=h;
 IF p_action='support' THEN
  IF NOT admin OR NOT EXISTS(SELECT 1 FROM householdmembers WHERE householdid=h AND userid=target) THEN RETURN '{"error":"forbidden"}'; END IF;
  IF d->>'skill' NOT IN ('tidying','caring','kitchen','other') OR d->>'level' NOT IN ('together','hints','independent') OR d->>'skill' IS NULL OR d->>'level' IS NULL THEN RETURN '{"error":"Choose a support level and skill."}'; END IF;
  INSERT INTO familyworldsupport VALUES(h,target,d->>'skill',d->>'level')
  ON CONFLICT(householdid,userid,skill) DO UPDATE SET level=EXCLUDED.level;
 ELSIF p_action='place' THEN
  required:=CASE d->>'piece' WHEN 'garden' THEN 3 WHEN 'picnic' THEN 8 WHEN 'observatory' THEN 15 ELSE NULL END;
  IF required IS NULL OR d->>'position' IS NULL OR d->>'position' NOT IN ('left','right','back','stored') THEN RETURN '{"error":"Choose a decoration and a place."}'; END IF;
  IF n<required THEN RETURN '{"error":"This decoration is still growing. Complete more family missions."}'; END IF;
  INSERT INTO familyworldplacements VALUES(h,d->>'piece',d->>'position')
  ON CONFLICT(householdid,piece) DO UPDATE SET position=EXCLUDED.position;
 END IF;
 RETURN jsonb_build_object('completed',n,
  'placements',coalesce((SELECT jsonb_object_agg(piece,position) FROM familyworldplacements WHERE householdid=h),'{}'::jsonb),
  'support',coalesce((SELECT jsonb_agg(jsonb_build_object('userId',s.userid,'skill',s.skill,'level',s.level)) FROM familyworldsupport s JOIN householdmembers m ON m.householdid=s.householdid AND m.userid=s.userid WHERE s.householdid=h AND (admin OR s.userid=c)),'[]'::jsonb))::text;
END $$;
