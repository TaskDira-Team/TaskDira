using System.Text.Json;
using System.Text.RegularExpressions;
using Npgsql;

internal static class SourceExport
{
    internal static async Task RunAsync(NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
        var output = Path.GetFullPath("Backend/db/mssql/source-export");
        var dataPath = Path.GetFullPath("Backend/.migration-private/source");
        Directory.CreateDirectory(output);
        Directory.CreateDirectory(dataPath);
        async Task<JsonElement> Query(string sql)
        {
            await using var command = new NpgsqlCommand($"SELECT coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb)::text FROM ({sql}) q", connection, transaction);
            return JsonDocument.Parse((string)(await command.ExecuteScalarAsync())!).RootElement.Clone();
        }
        var metadata = new Dictionary<string, JsonElement>
        {
            ["database"] = await Query("SELECT current_setting('server_version') version, current_setting('TimeZone') timezone, current_setting('transaction_read_only') read_only, pg_database_size(current_database()) size_bytes, datcollate, datctype FROM pg_database WHERE datname=current_database()"),
            ["columns"] = await Query("SELECT c.table_schema, c.table_name, c.column_name, c.ordinal_position, c.data_type, c.udt_name, c.character_maximum_length, c.is_nullable, c.column_default, c.datetime_precision, c.numeric_precision, c.numeric_scale, c.collation_name, c.is_identity FROM information_schema.columns c WHERE c.table_schema='public' ORDER BY c.table_name,c.ordinal_position"),
            ["constraints"] = await Query("SELECT c.conname name, c.contype::text type, c.conrelid::regclass::text table_name, pg_get_constraintdef(c.oid,true) definition, c.condeferrable, c.condeferred, c.convalidated FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' ORDER BY c.conrelid::regclass::text,c.conname"),
            ["indexes"] = await Query("SELECT tablename table_name,indexname name,indexdef definition FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname"),
            ["sequences"] = await Query("SELECT sequencename name, data_type::text, start_value, min_value, max_value, increment_by, cycle, cache_size, last_value FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename"),
            ["routines"] = await Query("SELECT p.oid, p.proname name, p.prokind::text kind, l.lanname language, pg_get_function_identity_arguments(p.oid) arguments, pg_get_function_result(p.oid) result, pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang WHERE n.nspname='public' AND p.prokind IN ('f','p') ORDER BY p.proname,p.oid"),
            ["dependencies"] = await Query("SELECT pg_describe_object(d.classid,d.objid,d.objsubid) object, pg_describe_object(d.refclassid,d.refobjid,d.refobjsubid) dependency,d.deptype::text FROM pg_depend d WHERE (d.classid='pg_proc'::regclass AND d.objid IN(SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public')) OR (d.classid='pg_class'::regclass AND d.objid IN(SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public')) ORDER BY 1,2"),
            ["triggers"] = await Query("SELECT c.relname table_name,t.tgname name,pg_get_triggerdef(t.oid,true) definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal"),
            ["views"] = await Query("SELECT viewname name,definition FROM pg_views WHERE schemaname='public'"),
            ["policies"] = await Query("SELECT * FROM pg_policies WHERE schemaname='public'"),
            ["tables"] = await Query("SELECT c.relname name,c.relkind::text kind,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname")
        };
        var sequenceStates = new List<JsonElement>();
        foreach(var sequence in metadata["sequences"].EnumerateArray())
        {
            var name=sequence.GetProperty("name").GetString()!;
            var state=await Query($"SELECT '{name.Replace("'","''")}' name,last_value,is_called FROM public.\"{name.Replace("\"","\"\"")}\"");
            sequenceStates.Add(state[0].Clone());
        }
        metadata["sequence_states"]=JsonSerializer.SerializeToElement(sequenceStates);
        var schemaJson = JsonSerializer.Serialize(metadata, new JsonSerializerOptions { WriteIndented = true });
        if (Regex.IsMatch(schemaJson, @"postgres(?:ql)?://|password\s*=", RegexOptions.IgnoreCase))
            throw new InvalidOperationException("Catalog requires manual sanitization before export.");
        await File.WriteAllTextAsync(Path.Combine(output,"catalog.json"), schemaJson);
        var routines = metadata["routines"].EnumerateArray().ToArray();
        await File.WriteAllTextAsync(Path.Combine(output,"functions.sql"), string.Join("\n\n", routines.Select(r=>r.GetProperty("definition").GetString()+";")));
        var called = Directory.GetFiles("Backend/src/TaskDira.Api/Repositories","*.cs")
            .SelectMany(f=>Regex.Matches(File.ReadAllText(f),@"neondb_stp_\w+").Select(m=>m.Value))
            .Where(name=>name is not "neondb_stp_register_atomic" and not "neondb_stp_claim_reward_atomic")
            .Distinct().Order().ToArray();
        var live = routines.Select(r=>r.GetProperty("name").GetString()!).ToHashSet();
        var missing = called.Where(c=>!live.Contains(c)).ToArray();
        var counts = new Dictionary<string,int>();
        foreach(var table in metadata["tables"].EnumerateArray())
        {
            var name = table.GetProperty("name").GetString()!;
            var quoted = '"'+name.Replace("\"","\"\"")+'"';
            var projection=metadata["columns"].EnumerateArray().Where(c=>c.GetProperty("table_name").GetString()==name)
                .Select(c=>{var col='"'+c.GetProperty("column_name").GetString()!.Replace("\"","\"\"")+'"'; return c.GetProperty("udt_name").GetString()=="jsonb" ? col+"::text AS "+col : col;});
            var data = await Query($"SELECT {string.Join(",",projection)} FROM public.{quoted}");
            await File.WriteAllTextAsync(Path.Combine(dataPath,name+".json"),data.GetRawText());
            counts[name] = data.GetArrayLength();
        }
        await File.WriteAllTextAsync(Path.Combine(dataPath,"snapshot-catalog.json"),schemaJson);
        var report = new { capturedUtc=DateTime.UtcNow, readOnly=true, applicationRoutines=called.Length, liveRoutines=routines.Length, missing, catalogOnly=live.Except(called).Order().ToArray(), counts };
        await File.WriteAllTextAsync(Path.Combine(output,"manifest.json"),JsonSerializer.Serialize(report,new JsonSerializerOptions{WriteIndented=true}));
        Console.WriteLine($"Read-only snapshot exported: {counts.Count} tables, {counts.Values.Sum()} rows, {routines.Length} routines; {missing.Length} missing application routines. Data is in the Git-ignored private directory.");
        if(missing.Length!=0) throw new InvalidOperationException("Missing application routines.");
    }
}
