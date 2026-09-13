using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

internal static class TargetScripts
{
    internal static string Value(JsonElement item,string key) => item.GetProperty(key).ValueKind==JsonValueKind.Null ? "" : item.GetProperty(key).ToString();
    internal static string Quote(string name) => "["+name.Replace("]","]]")+"]";
    internal static string ConvertExpression(string text)
    {
        text=Regex.Replace(text,@"now\(\)(?:\s+AT TIME ZONE 'utc'(?:::text)?)?","SYSUTCDATETIME()",RegexOptions.IgnoreCase);
        text=Regex.Replace(text,@"::(?:character varying|timestamp without time zone|integer|int|jsonb|text)","");
        text=Regex.Replace(text,@"\bfalse\b","0",RegexOptions.IgnoreCase);
        text=Regex.Replace(text,@"\btrue\b","1",RegexOptions.IgnoreCase);
        text=Regex.Replace(text,@"(?<![\w@])p_\w+",m=>"@"+m.Value);
        text=Regex.Replace(text,@"(?<![\w'])'((?:[^']|'')*)'",m=>"N'"+m.Groups[1].Value+"'");
        return text;
    }
    internal static void Generate()
    {
        using var document=JsonDocument.Parse(File.ReadAllText("Backend/db/mssql/source-export/catalog.json"));
        var root=document.RootElement;
        if(root.GetProperty("triggers").GetArrayLength()!=0 || root.GetProperty("views").GetArrayLength()!=0 || root.GetProperty("policies").GetArrayLength()!=0)
            throw new InvalidOperationException("Additional database objects require review.");
        var schema=new StringBuilder("SET ANSI_NULLS ON;\nSET QUOTED_IDENTIFIER ON;\nSET XACT_ABORT ON;\nSET NOCOUNT ON;\n");
        var pg=new StringBuilder("CREATE SCHEMA IF NOT EXISTS public;\n");
        foreach(var seq in root.GetProperty("sequences").EnumerateArray())
            pg.AppendLine($"CREATE SEQUENCE public.{Value(seq,"name")} AS {Value(seq,"data_type")} INCREMENT BY {Value(seq,"increment_by")} MINVALUE {Value(seq,"min_value")} MAXVALUE {Value(seq,"max_value")} START WITH {Value(seq,"start_value")} CACHE {Value(seq,"cache_size")}{(Value(seq,"cycle")=="True"?" CYCLE":" NO CYCLE")};");
        foreach(var table in root.GetProperty("tables").EnumerateArray())
        {
            var name=Value(table,"name");
            var columns=root.GetProperty("columns").EnumerateArray().Where(c=>Value(c,"table_name")==name).ToArray();
            var definitions=new List<string>();
            var pgDefinitions=new List<string>();
            foreach(var column in columns)
            {
                var col=Value(column,"column_name");
                var type=Value(column,"udt_name");
                var len=Value(column,"character_maximum_length");
                var sqlType=type switch { "int4"=>"int", "bool"=>"bit", "timestamp"=>"datetime2(6)", "varchar"=>$"nvarchar({int.Parse(len)*2})", "text"=>col=="tokenhash"?"nvarchar(450)":"nvarchar(max)", "jsonb"=>"nvarchar(max)", _=>throw new InvalidOperationException("Unsupported column type.") };
                var originalDefault=Value(column,"column_default");
                var identity=originalDefault.StartsWith("nextval(");
                var nullable=Value(column,"is_nullable")=="YES"?" NULL":" NOT NULL";
                var defaultSql=originalDefault.Length==0 || identity ? "" : $" CONSTRAINT {Quote("df_"+name+"_"+col)} DEFAULT ({ConvertExpression(originalDefault)})";
                definitions.Add($"{Quote(col)} {sqlType}{(identity?" IDENTITY(1,1)":"")}{nullable}{defaultSql}");
                if(type=="varchar")
                    definitions.Add($"CONSTRAINT {Quote("ck_"+name+"_"+col+"_length")} CHECK (LEN(({Quote(col)}+N'#') COLLATE Latin1_General_100_CS_AS_SC)-1 <= {len})");
                if(type=="jsonb") definitions.Add($"CONSTRAINT {Quote("ck_"+name+"_"+col+"_json")} CHECK (ISJSON({Quote(col)}, VALUE)=1)");
                pgDefinitions.Add($"\"{col}\" {Value(column,"data_type")}{(type=="varchar"?"("+len+")":"")}{nullable}{(originalDefault.Length>0?" DEFAULT "+originalDefault:"")}");
            }
            if(name=="users") definitions.Add("emailbytes AS DATALENGTH(email) PERSISTED");
            if(name=="sessions") definitions.Add("tokenhashbytes AS DATALENGTH(tokenhash) PERSISTED");
            schema.AppendLine($"CREATE TABLE dbo.{Quote(name)} (\n    {string.Join(",\n    ",definitions)}\n);");
            pg.AppendLine($"CREATE TABLE public.{name} (\n    {string.Join(",\n    ",pgDefinitions)}\n);");
            foreach(var column in columns.Where(c=>Value(c,"column_default").StartsWith("nextval(")))
            {
                var sequenceName=Regex.Match(Value(column,"column_default"),@"nextval\('([^']+)'").Groups[1].Value;
                pg.AppendLine($"ALTER SEQUENCE public.{sequenceName} OWNED BY public.{name}.{Value(column,"column_name")};");
            }
        }
        foreach(var constraint in root.GetProperty("constraints").EnumerateArray().OrderBy(c=>Value(c,"type")=="f"?1:0))
        {
            var type=Value(constraint,"type");
            if(type=="n") continue;
            var name=Value(constraint,"name");
            var table=Value(constraint,"table_name");
            var definition=Value(constraint,"definition");
            pg.AppendLine($"ALTER TABLE public.{table} ADD CONSTRAINT {name} {definition};");
            if(type=="u" && table=="users") definition="UNIQUE (email,emailbytes)";
            if(type=="u" && table=="sessions") definition="UNIQUE (tokenhash,tokenhashbytes)";
            definition=Regex.Replace(definition,@"REFERENCES (\w+)","REFERENCES dbo.$1");
            schema.AppendLine($"ALTER TABLE dbo.{Quote(table)} ADD CONSTRAINT {Quote(name)} {ConvertExpression(definition)};");
        }
        var constraintNames=root.GetProperty("constraints").EnumerateArray().Select(c=>Value(c,"name")).ToHashSet();
        foreach(var index in root.GetProperty("indexes").EnumerateArray().Where(i=>!constraintNames.Contains(Value(i,"name"))))
        {
            var definition=Value(index,"definition");
            pg.AppendLine(definition+";");
            definition=definition.Replace("public.","dbo.").Replace(" USING btree","");
            if(Value(index,"name")=="ux_pointsleader_task_earn") definition+=" AND taskid IS NOT NULL";
            schema.AppendLine(definition+";");
        }
        schema.AppendLine("CREATE INDEX ix_pointsleader_wallet ON dbo.pointsleader(householdid,userid) INCLUDE(pointsearned);");
        var procedures=new StringBuilder("SET ANSI_NULLS ON;\nSET QUOTED_IDENTIFIER ON;\nGO\n");
        foreach(var routine in root.GetProperty("routines").EnumerateArray())
        {
            var name=Value(routine,"name");
            var parameters=Value(routine,"arguments").Split(',',StringSplitOptions.TrimEntries|StringSplitOptions.RemoveEmptyEntries)
                .Select(p=> {var parts=p.Split(' ',2); return "@"+parts[0]+" "+(parts[1] switch {"integer"=>"int","text"=>"nvarchar(max)","boolean"=>"bit","timestamp without time zone"=>"datetime2(6)",_=>throw new InvalidOperationException("Unsupported parameter type.")});});
            var body=Regex.Match(Value(routine,"definition"),@"\$function\$(.*?)\$function\$",RegexOptions.Singleline).Groups[1].Value.Trim();
            if(name=="neondb_stp_insert_household_with_admin") body=HouseholdInsert;
            else if(name=="neondb_stp_insert_points_ledger") body=Earn;
            else if(name=="neondb_stp_insert_points_spend") body=Spend;
            else if(name=="neondb_stp_is_household_member") body="SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.householdmembers WHERE householdid=@p_householdid AND userid=@p_userid) THEN 1 ELSE 0 END AS bit);";
            else
            {
                var mutation=Regex.Match(body,@"^WITH (?:deleted|updated|claimed) AS\s*\((.*?)\s+RETURNING\s+(?:1|id)\s*\)\s*SELECT.*$",RegexOptions.Singleline|RegexOptions.IgnoreCase);
                if(mutation.Success) body=mutation.Groups[1].Value+"; SELECT @@ROWCOUNT;";
                else if(body.StartsWith("INSERT",StringComparison.OrdinalIgnoreCase))
                {
                    body=Regex.Replace(body,@"\s+RETURNING \*;?\s*$",";",RegexOptions.IgnoreCase);
                    body=Regex.Replace(body,@"\bVALUES\b","OUTPUT INSERTED.* VALUES",RegexOptions.IgnoreCase);
                }
                body=ConvertExpression(body);
                body=Regex.Replace(body,@"OFFSET @p_offset LIMIT @p_limit","OFFSET @p_offset ROWS FETCH NEXT @p_limit ROWS ONLY");
                if(name=="neondb_stp_get_leaderboard") body=body.Replace("ORDER BY rank","ORDER BY CASE WHEN rank IS NULL THEN 1 ELSE 0 END, rank, id");
                if(name=="neondb_stp_get_user_by_email") body=body.Replace("email = @p_email","email = @p_email AND DATALENGTH(email)=DATALENGTH(@p_email)");
                if(name.Contains("session_by_token_hash")) body=body.Replace("tokenhash = @p_tokenhash","tokenhash = @p_tokenhash AND DATALENGTH(tokenhash)=DATALENGTH(@p_tokenhash)");
            }
            procedures.AppendLine($"CREATE OR ALTER PROCEDURE dbo.{name}\n{string.Join(",\n",parameters)}\nAS\nBEGIN\nSET NOCOUNT ON;\nSET XACT_ABORT ON;\n{body}\nEND;\nGO\n");
        }
        procedures.AppendLine(AtomicClaim);
        procedures.AppendLine(AtomicRegistration);
        Directory.CreateDirectory("Backend/db/sqlserver");
        File.WriteAllText("Backend/db/sqlserver/001_schema.sql",schema.ToString());
        File.WriteAllText("Backend/db/sqlserver/002_procedures.sql",procedures.ToString());
        File.WriteAllText("Backend/db/mssql/source-export/schema.sql",pg.ToString());
        Console.WriteLine("Generated schema and 62 parity procedures plus atomic claim and registration from the exported catalog.");
    }
    private const string HouseholdInsert="""
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
""";
    private const string Earn="""
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
""";
    private const string Spend="""
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
""";
    private const string AtomicClaim="""
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
""";
    private const string AtomicRegistration="""
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
""";
}
