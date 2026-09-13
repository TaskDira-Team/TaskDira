using System.Data;
using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;

internal static class TargetDatabase
{
    internal const string DatabaseName="TaskDira_MigrationDev";
    internal static SqlConnection Connection(string database=DatabaseName) => new(new SqlConnectionStringBuilder
    {
        DataSource=@"lpc:.\SQLEXPRESS", InitialCatalog=database, IntegratedSecurity=true,
        Encrypt=SqlConnectionEncryptOption.Optional, ConnectTimeout=10, ApplicationName="TaskDira Local Migration"
    }.ConnectionString);

    internal static async Task RunAsync(bool import)
    {
        using var document=JsonDocument.Parse(File.ReadAllText("Backend/.migration-private/source/snapshot-catalog.json"));
        var root=document.RootElement;
        if(import)
        {
            await using var master=Connection("master");
            await master.OpenAsync();
            await using var exists=new SqlCommand("SELECT DB_ID(@name)",master);
            exists.Parameters.AddWithValue("@name",DatabaseName);
            if(await exists.ExecuteScalarAsync() is DBNull)
            {
                await using var create=new SqlCommand($"CREATE DATABASE [{DatabaseName}] COLLATE Latin1_General_100_BIN2",master);
                await create.ExecuteNonQueryAsync();
                Console.WriteLine("Created isolated TaskDira_MigrationDev database.");
            }
        }
        await using var target=Connection();
        await target.OpenAsync();
        if(import)
        {
            await using var guard=new SqlCommand("SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0",target);
            if(Convert.ToInt32(await guard.ExecuteScalarAsync())!=0)
                throw new InvalidOperationException("Target contains tables; refusing to overwrite.");
            await using var transaction=(SqlTransaction)await target.BeginTransactionAsync();
            foreach(var file in new[]{"001_schema.sql","002_procedures.sql"})
                foreach(var batch in Regex.Split(File.ReadAllText("Backend/db/sqlserver/"+file),@"^GO\s*$",RegexOptions.Multiline|RegexOptions.IgnoreCase).Where(s=>!string.IsNullOrWhiteSpace(s)))
                {
                    await using var command=new SqlCommand(batch,target,transaction){CommandTimeout=60};
                    try {await command.ExecuteNonQueryAsync();}
                    catch(SqlException exception) {Console.Error.WriteLine($"Target script failed: {file}; SQL number: {exception.Number}; line: {exception.LineNumber}."); throw;}
                }
            foreach(var name in new[]{"users","categories","householdinfo","householdmembers","rewards","tasks","tasksubitems","pointsleader","monthlyleaderboard","sessions"})
            {
                var columns=root.GetProperty("columns").EnumerateArray().Where(c=>TargetScripts.Value(c,"table_name")==name).ToArray();
                using var rows=JsonDocument.Parse(File.ReadAllText("Backend/.migration-private/source/"+name+".json"));
                var data=new DataTable();
                foreach(var column in columns)
                    data.Columns.Add(TargetScripts.Value(column,"column_name"),TargetScripts.Value(column,"udt_name") switch {"int4"=>typeof(int),"bool"=>typeof(bool),"timestamp"=>typeof(DateTime),_=>typeof(string)});
                foreach(var row in rows.RootElement.EnumerateArray())
                    data.Rows.Add(columns.Select(c=>ConvertValue(row.GetProperty(TargetScripts.Value(c,"column_name")),TargetScripts.Value(c,"udt_name"))).ToArray());
                using var bulk=new SqlBulkCopy(target,SqlBulkCopyOptions.KeepIdentity|SqlBulkCopyOptions.CheckConstraints|SqlBulkCopyOptions.KeepNulls,transaction){DestinationTableName="dbo."+TargetScripts.Quote(name)};
                foreach(DataColumn column in data.Columns) bulk.ColumnMappings.Add(column.ColumnName,column.ColumnName);
                await bulk.WriteToServerAsync(data);
                var identity=columns.FirstOrDefault(c=>TargetScripts.Value(c,"column_default").StartsWith("nextval("));
                if(identity.ValueKind!=JsonValueKind.Undefined)
                {
                    var seqName=Regex.Match(TargetScripts.Value(identity,"column_default"),@"nextval\('([^']+)'").Groups[1].Value;
                    var sequence=root.GetProperty("sequence_states").EnumerateArray().Single(s=>TargetScripts.Value(s,"name")==seqName);
                    var last=sequence.GetProperty("last_value").GetInt64();
                    var used=sequence.GetProperty("is_called").GetBoolean();
                    var max=rows.RootElement.EnumerateArray().Select(r=>r.GetProperty("id").GetInt64()).DefaultIfEmpty(0).Max();
                    var reseed=Math.Max(max,used?last:last-1);
                    if(data.Rows.Count==0) reseed++;
                    await using var seed=new SqlCommand($"DBCC CHECKIDENT ('dbo.{name}', RESEED, {reseed}) WITH NO_INFOMSGS",target,transaction);
                    await seed.ExecuteNonQueryAsync();
                }
                Console.WriteLine($"Imported {name}: {data.Rows.Count} rows.");
            }
            await transaction.CommitAsync();
        }
        await VerifyAsync(target,root);
    }

    private static object ConvertValue(JsonElement value,string type) => value.ValueKind==JsonValueKind.Null?DBNull.Value:type switch
    {
        "int4"=>value.GetInt32(), "bool"=>value.GetBoolean(),
        "timestamp"=>DateTime.SpecifyKind(DateTime.Parse(value.GetString()!,CultureInfo.InvariantCulture),DateTimeKind.Unspecified),
        _=>value.GetString()!
    };

    private static async Task VerifyAsync(SqlConnection target,JsonElement root)
    {
        var results=new List<object>();
        foreach(var table in root.GetProperty("tables").EnumerateArray())
        {
            var name=TargetScripts.Value(table,"name");
            var columns=root.GetProperty("columns").EnumerateArray().Where(c=>TargetScripts.Value(c,"table_name")==name).ToArray();
            using var rows=JsonDocument.Parse(File.ReadAllText("Backend/.migration-private/source/"+name+".json"));
            var pk=name=="householdmembers"?new[]{"householdid","userid"}:new[]{"id"};
            string Key(JsonElement row)=>string.Join("/",pk.Select(k=>row.GetProperty(k).ToString()));
            var source=rows.RootElement.EnumerateArray().ToDictionary(Key);
            await using var command=new SqlCommand($"SELECT {string.Join(",",columns.Select(c=>TargetScripts.Quote(TargetScripts.Value(c,"column_name"))))} FROM dbo.{TargetScripts.Quote(name)}",target);
            await using var reader=await command.ExecuteReaderAsync();
            var count=0;
            while(await reader.ReadAsync())
            {
                count++;
                var key=string.Join("/",pk.Select(k=>reader[k].ToString()));
                if(!source.TryGetValue(key,out var original)) throw new InvalidOperationException("Target has extra rows.");
                foreach(var col in columns)
                {
                    var column=TargetScripts.Value(col,"column_name");
                    var expected=ConvertValue(original.GetProperty(column),TargetScripts.Value(col,"udt_name"));
                    var actual=reader[column];
                    if(!Equals(expected,actual)) throw new InvalidOperationException("Source/target value mismatch in "+name+"."+column);
                }
            }
            if(count!=source.Count) throw new InvalidOperationException("Source/target count mismatch.");
            results.Add(new {table=name,rows=count,allColumnValuesMatch=true});
        }
        await using(var constraints=new SqlCommand("DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS",target))
        await using(var reader=await constraints.ExecuteReaderAsync())
            if(await reader.ReadAsync()) throw new InvalidOperationException("Target constraint violations.");
        await using(var enabled=new SqlCommand("SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1",target))
            if(Convert.ToInt32(await enabled.ExecuteScalarAsync())!=0) throw new InvalidOperationException("Untrusted foreign keys.");
        await using(var wallets=new SqlCommand("SELECT householdid,userid,SUM(CONVERT(bigint,pointsearned)) balance,SUM(CASE WHEN pointsearned>0 THEN CONVERT(bigint,pointsearned) ELSE 0 END) xp FROM dbo.pointsleader GROUP BY householdid,userid",target))
        await using(var reader=await wallets.ExecuteReaderAsync())
        {
            using var ledger=JsonDocument.Parse(File.ReadAllText("Backend/.migration-private/source/pointsleader.json"));
            while(await reader.ReadAsync())
            {
                var rows=ledger.RootElement.EnumerateArray().Where(r=>r.GetProperty("householdid").GetInt32()==reader.GetInt32(0)&&r.GetProperty("userid").GetInt32()==reader.GetInt32(1)).ToArray();
                if(rows.Sum(r=>(long)r.GetProperty("pointsearned").GetInt32())!=reader.GetInt64(2) || rows.Sum(r=>Math.Max(0L,r.GetProperty("pointsearned").GetInt32()))!=reader.GetInt64(3))
                    throw new InvalidOperationException("Wallet parity failed.");
            }
        }
        await File.WriteAllTextAsync("Backend/db/sqlserver/verification.json",JsonSerializer.Serialize(new{verifiedUtc=DateTime.UtcNow,tables=results,foreignKeysTrusted=true,constraintsValid=true,walletsMatch=true},new JsonSerializerOptions{WriteIndented=true}));
        Console.WriteLine("Verified every source row and column, all foreign keys/checks, and per-wallet XP/balances. No private values printed.");
    }
}
