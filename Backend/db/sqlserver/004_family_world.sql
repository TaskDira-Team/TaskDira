IF OBJECT_ID('dbo.familyworldcredits') IS NULL
CREATE TABLE dbo.familyworldcredits(householdid int NOT NULL REFERENCES dbo.householdinfo(id) ON DELETE CASCADE,taskid int NOT NULL,PRIMARY KEY(householdid,taskid));
IF OBJECT_ID('dbo.familyworldplacements') IS NULL
CREATE TABLE dbo.familyworldplacements(householdid int NOT NULL REFERENCES dbo.householdinfo(id) ON DELETE CASCADE,piece nvarchar(30) NOT NULL,position nvarchar(30) NOT NULL,PRIMARY KEY(householdid,piece));
IF OBJECT_ID('dbo.familyworldsupport') IS NULL
CREATE TABLE dbo.familyworldsupport(householdid int NOT NULL REFERENCES dbo.householdinfo(id) ON DELETE CASCADE,userid int NOT NULL REFERENCES dbo.users(id) ON DELETE CASCADE,skill nvarchar(30) NOT NULL,level nvarchar(30) NOT NULL,PRIMARY KEY(householdid,userid,skill));
GO
CREATE OR ALTER PROCEDURE dbo.neondb_stp_family_world @p_action nvarchar(30),@p_data nvarchar(max)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 DECLARE @h int=TRY_CAST(JSON_VALUE(@p_data,'$.household') AS int),@c int=TRY_CAST(JSON_VALUE(@p_data,'$.caller') AS int),
 @target int=TRY_CAST(JSON_VALUE(@p_data,'$.target') AS int),@piece nvarchar(30)=JSON_VALUE(@p_data,'$.piece'),
 @position nvarchar(30)=JSON_VALUE(@p_data,'$.position'),@skill nvarchar(30)=JSON_VALUE(@p_data,'$.skill'),@level nvarchar(30)=JSON_VALUE(@p_data,'$.level'),
 @admin bit=0,@n int,@required int,@placements nvarchar(max),@support nvarchar(max);
 IF NOT EXISTS(SELECT 1 FROM dbo.householdmembers WHERE householdid=@h AND userid=@c)
 BEGIN SELECT N'{"error":"forbidden"}'; RETURN; END;
 IF NOT EXISTS(SELECT 1 FROM dbo.managedprofiles WHERE userid=@c) AND EXISTS(SELECT 1 FROM dbo.householdmembers WHERE householdid=@h AND userid=@c AND LOWER(role)=N'admin') SET @admin=1;
 IF @p_action NOT IN ('read','place','support') BEGIN SELECT N'{"error":"Unknown world action."}'; RETURN; END;
 BEGIN TRY
 BEGIN TRANSACTION;
 -- Serialize progress and placement changes for this home only.
 SELECT @n=id FROM dbo.householdinfo WITH(UPDLOCK,HOLDLOCK) WHERE id=@h;
 INSERT dbo.familyworldcredits(householdid,taskid)
 SELECT @h,id FROM dbo.tasks t WHERE householdid=@h AND LOWER(status)=N'done' AND NOT EXISTS(SELECT 1 FROM dbo.familyworldcredits WHERE householdid=@h AND taskid=t.id);
 SELECT @n=COUNT(*) FROM dbo.familyworldcredits WHERE householdid=@h;
 IF @p_action='support'
 BEGIN
  IF @admin=0 OR NOT EXISTS(SELECT 1 FROM dbo.householdmembers WHERE householdid=@h AND userid=@target)
  BEGIN ROLLBACK; SELECT N'{"error":"forbidden"}'; RETURN; END;
  IF @skill IS NULL OR @level IS NULL OR @skill NOT IN ('tidying','caring','kitchen','other') OR @level NOT IN ('together','hints','independent')
  BEGIN ROLLBACK; SELECT N'{"error":"Choose a support level and skill."}'; RETURN; END;
  UPDATE dbo.familyworldsupport SET level=@level WHERE householdid=@h AND userid=@target AND skill=@skill;
  IF @@ROWCOUNT=0 INSERT dbo.familyworldsupport VALUES(@h,@target,@skill,@level);
 END;
 IF @p_action='place'
 BEGIN
  SET @required=CASE @piece WHEN 'garden' THEN 3 WHEN 'picnic' THEN 8 WHEN 'observatory' THEN 15 END;
  IF @required IS NULL OR @position IS NULL OR @position NOT IN ('left','right','back','stored')
  BEGIN ROLLBACK; SELECT N'{"error":"Choose a decoration and a place."}'; RETURN; END;
  IF @n<@required BEGIN ROLLBACK; SELECT N'{"error":"This decoration is still growing. Complete more family missions."}'; RETURN; END;
  UPDATE dbo.familyworldplacements SET position=@position WHERE householdid=@h AND piece=@piece;
  IF @@ROWCOUNT=0 INSERT dbo.familyworldplacements VALUES(@h,@piece,@position);
 END;
 SELECT @placements=N'{'+COALESCE(STRING_AGG(N'"'+STRING_ESCAPE(piece,'json')+N'":"'+STRING_ESCAPE(position,'json')+N'"',N','),N'')+N'}' FROM dbo.familyworldplacements WHERE householdid=@h;
 SELECT @support=(SELECT s.userid AS userId,s.skill,s.level FROM dbo.familyworldsupport s JOIN dbo.householdmembers m ON m.householdid=s.householdid AND m.userid=s.userid WHERE s.householdid=@h AND (@admin=1 OR s.userid=@c) FOR JSON PATH);
 COMMIT;
 SELECT (SELECT @n AS completed,JSON_QUERY(@placements) AS placements,JSON_QUERY(@support) AS support FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
 END TRY
 BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK;
 THROW;
 END CATCH;
END;
