CREATE OR REPLACE FUNCTION neondb_stp_count_points_ledger_for_task(p_taskid integer)
RETURNS integer LANGUAGE sql AS $$
    SELECT COUNT(*)::integer FROM pointsleader WHERE taskid = p_taskid;
$$;
