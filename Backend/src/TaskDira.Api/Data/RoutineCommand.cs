using System.Data;
using System.Data.Common;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Data.SqlClient;

namespace TaskDira.Api.Data;

public static partial class RoutineCommand
{
    public static CommandDefinition Create(DbConnection connection, string postgresCommand, object? parameters = null, CancellationToken cancellationToken = default)
    {
        if (connection is not SqlConnection)
            return new CommandDefinition(postgresCommand, parameters, cancellationToken: cancellationToken);

        var match = RoutineName().Match(postgresCommand);
        if (!match.Success)
            throw new InvalidOperationException("Invalid repository routine command.");

        var sqlParameters = new DynamicParameters(parameters);
        if (parameters is not null)
            foreach (var property in parameters.GetType().GetProperties())
                if (property.PropertyType == typeof(DateTime) || property.PropertyType == typeof(DateTime?))
                    sqlParameters.Add(property.Name, property.GetValue(parameters), DbType.DateTime2);
        return new CommandDefinition("dbo." + match.Value, sqlParameters, commandType: CommandType.StoredProcedure, cancellationToken: cancellationToken);
    }

    [GeneratedRegex(@"\bneondb_stp_[a-z_]+\b")]
    private static partial Regex RoutineName();
}
