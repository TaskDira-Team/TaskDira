using Npgsql;

try
{
    if (args.Contains("--generate"))
    {
        TargetScripts.Generate();
        return;
    }
    if (args.Contains("--import") || args.Contains("--verify"))
    {
        await TargetDatabase.RunAsync(args.Contains("--import"));
        return;
    }
    var source = Environment.GetEnvironmentVariable("TASKDIRA_SOURCE_DB");
    if (string.IsNullOrWhiteSpace(source))
        throw new InvalidOperationException("Source variable is missing.");

    NpgsqlConnectionStringBuilder settings;
    if (source.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        source.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        var uri = new Uri(source);
        var credentials = uri.UserInfo.Split(':', 2);
        settings = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = credentials.Length > 1 ? Uri.UnescapeDataString(credentials[1]) : "",
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            SslMode = SslMode.Require
        };
    }
    else
    {
        settings = new NpgsqlConnectionStringBuilder(source);
    }

    settings.Options = "-c default_transaction_read_only=on";
    settings.Timeout = 10;
    settings.CommandTimeout = 30;
    settings.IncludeErrorDetail = false;
    settings.Pooling = false;
    if (args.Contains("--transport"))
    {
        var hostname = settings.Host ?? throw new InvalidOperationException("Source hostname is missing.");
        Console.WriteLine($"Internal-only hostname: {hostname.EndsWith(".railway.internal", StringComparison.OrdinalIgnoreCase)}.");
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        using var client = new System.Net.Sockets.TcpClient();
        await client.ConnectAsync(hostname, settings.Port, timeout.Token);
        Console.WriteLine("TCP connection established. Sending PostgreSQL SSL negotiation request (no credentials).");
        await using var stream = client.GetStream();
        await stream.WriteAsync(new byte[] { 0, 0, 0, 8, 4, 210, 22, 47 }, timeout.Token);
        var response = new byte[1];
        var length = await stream.ReadAsync(response, timeout.Token);
        Console.WriteLine(length == 0 ? "Endpoint closed before SSL negotiation response." :
            response[0] == 'S' ? "Endpoint accepts PostgreSQL SSL negotiation." :
            response[0] == 'N' ? "Endpoint declines PostgreSQL SSL negotiation." : "Endpoint returned an unexpected negotiation response.");
        Environment.ExitCode = length == 1 && response[0] == 'S' ? 0 : 1;
        return;
    }
    await using var connection = new NpgsqlConnection(settings.ConnectionString);
    await connection.OpenAsync();
    await using var transaction = await connection.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead);
    await using var command = new NpgsqlCommand("SELECT current_setting('transaction_read_only'), current_setting('server_version'), (SELECT count(*) FROM pg_tables WHERE schemaname = 'public'), (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public')", connection, transaction);
    await using var reader = await command.ExecuteReaderAsync();
    await reader.ReadAsync();
    Console.WriteLine($"Source connected. Read-only: {reader.GetString(0)}; PostgreSQL: {reader.GetString(1)}; public tables: {reader.GetInt64(2)}; public routines: {reader.GetInt64(3)}.");
    await reader.DisposeAsync();
    if (args.Contains("--export"))
        await SourceExport.RunAsync(connection, transaction);
    await transaction.RollbackAsync();
}
catch (Exception exception)
{
    for (Exception? cause = exception; cause is not null; cause = cause.InnerException)
    {
        Console.Error.WriteLine($"Failure type: {cause.GetType().Name}; HResult: {cause.HResult}.");
        if (cause is PostgresException postgres)
            Console.Error.WriteLine($"SQLSTATE: {postgres.SqlState}.");
        if (cause is System.Net.Sockets.SocketException socket)
            Console.Error.WriteLine($"Socket status: {socket.SocketErrorCode}.");
        foreach (var category in new[] { "SSL", "TLS", "certificate", "timeout", "timed out", "refused", "closed", "end of stream", "password authentication failed", "does not support SSL", "No such host" })
            if (cause.Message.Contains(category, StringComparison.OrdinalIgnoreCase))
                Console.Error.WriteLine($"Failure category: {category}.");
    }
    Environment.ExitCode = 1;
}
