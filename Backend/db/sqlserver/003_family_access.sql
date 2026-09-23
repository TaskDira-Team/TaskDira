IF OBJECT_ID('dbo.managedprofiles') IS NULL
CREATE TABLE dbo.managedprofiles(userid int PRIMARY KEY REFERENCES dbo.users(id), householdid int NOT NULL REFERENCES dbo.householdinfo(id), guardianid int NOT NULL REFERENCES dbo.users(id));
IF OBJECT_ID('dbo.familyinvitations') IS NULL
CREATE TABLE dbo.familyinvitations(id varchar(32) PRIMARY KEY, householdid int NOT NULL REFERENCES dbo.householdinfo(id), creatorid int NOT NULL REFERENCES dbo.users(id), tokenhash varchar(64) NOT NULL UNIQUE, createdat datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), expiresat datetime2 NOT NULL, revoked bit NOT NULL DEFAULT 0, acceptedby int NULL REFERENCES dbo.users(id));
IF OBJECT_ID('dbo.familypairings') IS NULL
CREATE TABLE dbo.familypairings(secrethash varchar(64) PRIMARY KEY, codehash varchar(64) NOT NULL UNIQUE, expiresat datetime2 NOT NULL, childid int NULL REFERENCES dbo.users(id), approvedby int NULL REFERENCES dbo.users(id), consumed bit NOT NULL DEFAULT 0);
GO
CREATE OR ALTER PROCEDURE dbo.neondb_stp_family_access @p_action nvarchar(30), @p_data nvarchar(max)
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 DECLARE @c int=TRY_CAST(JSON_VALUE(@p_data,'$.caller') AS int), @h int=TRY_CAST(JSON_VALUE(@p_data,'$.household') AS int),
 @child int=TRY_CAST(JSON_VALUE(@p_data,'$.child') AS int), @target int=TRY_CAST(JSON_VALUE(@p_data,'$.target') AS int),
 @hash varchar(64)=JSON_VALUE(@p_data,'$.hash'), @codehash varchar(64)=JSON_VALUE(@p_data,'$.codeHash'),
 @sessionhash varchar(64)=JSON_VALUE(@p_data,'$.sessionHash'), @id varchar(32)=JSON_VALUE(@p_data,'$.id'),
 @clock datetime2=SYSUTCDATETIME(), @expiry datetime2, @u int, @creator int, @inv varchar(32), @approved int,
 @result nvarchar(max)=N'{}', @error nvarchar(300)=NULL;
 BEGIN TRY
 BEGIN TRANSACTION;
 IF @p_action='context'
 BEGIN
  SELECT @result=(SELECT CAST(CASE WHEN EXISTS(SELECT 1 FROM dbo.managedprofiles WHERE userid=@target) THEN 1 ELSE 0 END AS bit) AS isManagedProfile,
   CAST(CASE WHEN EXISTS(SELECT 1 FROM dbo.managedprofiles p JOIN dbo.householdmembers m ON m.userid=p.userid AND m.householdid=p.householdid WHERE p.userid=@target AND LOWER(m.role)=N'member') THEN 1 ELSE 0 END AS bit) AS active,
   CAST(CASE WHEN @c=@target OR EXISTS(SELECT 1 FROM dbo.householdmembers a JOIN dbo.householdmembers b ON a.householdid=b.householdid WHERE a.userid=@c AND b.userid=@target) THEN 1 ELSE 0 END AS bit) AS canRead FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
 END
 ELSE
 BEGIN
 IF @p_action IN ('list','invite','revoke','child','switch','approve') AND (EXISTS(SELECT 1 FROM dbo.managedprofiles WHERE userid=@c) OR NOT EXISTS(SELECT 1 FROM dbo.householdmembers WHERE userid=@c AND householdid=@h AND LOWER(role)=N'admin'))
 SET @error=N'forbidden';
 IF @error IS NULL
 BEGIN
 IF @p_action='list'
 BEGIN
  SELECT @result=(SELECT JSON_QUERY((SELECT TOP(100) p.userid AS userId,u.fullname AS fullName,JSON_QUERY(u.avatarstate) AS avatarState FROM dbo.managedprofiles p JOIN dbo.users u ON u.id=p.userid JOIN dbo.householdmembers m ON m.userid=p.userid AND m.householdid=p.householdid WHERE p.householdid=@h ORDER BY p.userid FOR JSON PATH)) AS children,
   JSON_QUERY((SELECT TOP(50) id,createdat AS createdAt,expiresat AS expiresAt,CASE WHEN revoked=1 THEN 'revoked' WHEN acceptedby IS NOT NULL THEN 'accepted' WHEN expiresat<=@clock THEN 'expired' ELSE 'pending' END AS status FROM dbo.familyinvitations WHERE householdid=@h ORDER BY createdat DESC FOR JSON PATH)) AS invitations FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
 END
 ELSE IF @p_action='invite'
 BEGIN
  IF (SELECT COUNT(*) FROM dbo.familyinvitations WHERE householdid=@h AND revoked=0 AND acceptedby IS NULL AND expiresat>@clock)>=50 SET @error=N'Revoke an unused invitation before creating another.';
  ELSE BEGIN
   SET @expiry=DATEADD(day,7,@clock);
   INSERT dbo.familyinvitations(id,householdid,creatorid,tokenhash,expiresat) VALUES(@id,@h,@c,@hash,@expiry);
   SELECT @result=(SELECT @id AS id,@expiry AS expiresAt,'pending' AS status FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
  END
 END
 ELSE IF @p_action='revoke'
  UPDATE dbo.familyinvitations SET revoked=1 WHERE id=@id AND householdid=@h AND acceptedby IS NULL;
 ELSE IF @p_action IN ('preview','accept','join')
 BEGIN
  SELECT @inv=id,@h=householdid,@creator=creatorid,@expiry=expiresat FROM dbo.familyinvitations WITH(UPDLOCK,HOLDLOCK) WHERE tokenhash=@hash AND revoked=0 AND acceptedby IS NULL AND expiresat>@clock;
  IF @inv IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.householdmembers WHERE userid=@creator AND householdid=@h AND LOWER(role)=N'admin') SET @error=N'This invitation has expired, was used, or was cancelled. Ask your host for a new link.';
  ELSE IF @p_action='preview'
   SELECT @result=(SELECT name AS householdName,@expiry AS expiresAt FROM dbo.householdinfo WHERE id=@h FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
  ELSE BEGIN
   IF @p_action='accept'
   BEGIN
    IF @c IS NULL OR EXISTS(SELECT 1 FROM dbo.managedprofiles WHERE userid=@c) SET @error=N'forbidden';
    ELSE IF EXISTS(SELECT 1 FROM dbo.householdmembers WHERE userid=@c AND householdid=@h) SET @error=N'You already belong to this home.';
    SET @u=@c;
   END
   ELSE BEGIN
    IF EXISTS(SELECT 1 FROM dbo.users WHERE LOWER(email)=LOWER(JSON_VALUE(@p_data,'$.email'))) SET @error=N'This email already has an account. Sign in to accept the invitation.';
    ELSE BEGIN
     INSERT dbo.users(fullname,email,passwordhash,familyrole) VALUES(JSON_VALUE(@p_data,'$.fullname'),JSON_VALUE(@p_data,'$.email'),JSON_VALUE(@p_data,'$.passwordHash'),N'adult');
     SET @u=SCOPE_IDENTITY();
    END
   END
   IF @error IS NULL BEGIN
    INSERT dbo.householdmembers(householdid,userid,role) VALUES(@h,@u,N'Member');
    UPDATE dbo.familyinvitations SET acceptedby=@u WHERE id=@inv;
    SET @expiry=DATEADD(day,30,@clock);
    IF @p_action='join' INSERT dbo.sessions(userid,tokenhash,expiresat) VALUES(@u,@sessionhash,@expiry);
    SELECT @result=(SELECT @u AS userId,@h AS householdId,@expiry AS expiresAt FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
   END
  END
 END
 ELSE IF @p_action='child'
 BEGIN
  IF (SELECT COUNT(*) FROM dbo.managedprofiles WHERE householdid=@h)>=100 SET @error=N'This home has reached its child profile limit.';
  ELSE BEGIN
   INSERT dbo.users(fullname,email,passwordhash,avatarstate,familyrole) VALUES(JSON_VALUE(@p_data,'$.fullname'),JSON_VALUE(@p_data,'$.email'),JSON_VALUE(@p_data,'$.passwordHash'),(SELECT avatar FROM OPENJSON(@p_data) WITH(avatar nvarchar(max) '$.avatar')),N'kid');
   SET @u=SCOPE_IDENTITY();
   INSERT dbo.householdmembers(householdid,userid,role) VALUES(@h,@u,N'Member');
   INSERT dbo.managedprofiles(userid,householdid,guardianid) VALUES(@u,@h,@c);
   SELECT @result=(SELECT @u AS userId FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
  END
 END
 ELSE IF @p_action IN ('switch','approve')
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM dbo.managedprofiles p JOIN dbo.householdmembers m ON m.userid=p.userid AND m.householdid=p.householdid WHERE p.userid=@child AND p.householdid=@h AND LOWER(m.role)=N'member') SET @error=N'Choose a child in this home.';
  ELSE IF @p_action='approve'
  BEGIN
   UPDATE dbo.familypairings SET childid=@child,approvedby=@c WHERE codehash=@codehash AND expiresat>@clock AND childid IS NULL AND consumed=0;
   IF @@ROWCOUNT=0 SET @error=N'This code has expired or was already approved. Create a new code on the child device.';
  END
  ELSE BEGIN
   DELETE dbo.sessions WHERE userid=@c AND tokenhash=JSON_VALUE(@p_data,'$.oldHash');
   IF @@ROWCOUNT=0 SET @error=N'Sign in again before switching players.';
   ELSE BEGIN
    SET @expiry=DATEADD(hour,8,@clock);
    INSERT dbo.sessions(userid,tokenhash,expiresat) VALUES(@child,@sessionhash,@expiry);
    SELECT @result=(SELECT @child AS userId,@h AS householdId,@expiry AS expiresAt FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
   END
  END
 END
 ELSE IF @p_action='pair'
 BEGIN
  DELETE dbo.familypairings WHERE expiresat<@clock;
  INSERT dbo.familypairings(secrethash,codehash,expiresat) VALUES(@hash,@codehash,DATEADD(minute,10,@clock));
 END
 ELSE IF @p_action='poll'
 BEGIN
  SELECT @expiry=expiresat,@child=childid,@approved=approvedby FROM dbo.familypairings WITH(UPDLOCK,HOLDLOCK) WHERE secrethash=@hash AND consumed=0;
  IF @expiry IS NULL OR @expiry<=@clock SET @error=N'This pairing has ended. Create a new code.';
  ELSE IF @child IS NULL SET @result=N'{"pending":true}';
  ELSE BEGIN
   SELECT @h=p.householdid FROM dbo.managedprofiles p JOIN dbo.householdmembers m ON m.userid=p.userid AND m.householdid=p.householdid WHERE p.userid=@child AND LOWER(m.role)=N'member';
   IF @h IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.householdmembers WHERE householdid=@h AND userid=@approved AND LOWER(role)=N'admin') SET @error=N'A parent must approve a new code.';
   ELSE BEGIN
    UPDATE dbo.familypairings SET consumed=1 WHERE secrethash=@hash;
    SET @expiry=DATEADD(hour,8,@clock);
    INSERT dbo.sessions(userid,tokenhash,expiresat) VALUES(@child,@sessionhash,@expiry);
    SELECT @result=(SELECT @child AS userId,@h AS householdId,@expiry AS expiresAt FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
   END
  END
 END
 ELSE SET @error=N'Unknown family action.';
 END
 END
 IF @error IS NULL COMMIT; ELSE BEGIN ROLLBACK; SELECT @result=(SELECT @error AS error FOR JSON PATH,WITHOUT_ARRAY_WRAPPER); END
 SELECT @result;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  IF ERROR_NUMBER() IN (2601,2627) SELECT N'{"error":"This request was already completed. Refresh and try again."}';
  ELSE THROW;
 END CATCH
END;
GO
