SET NOCOUNT ON;

SELECT
    CONVERT(nvarchar(128), SERVERPROPERTY('ServerName')) AS server_name,
    CONVERT(nvarchar(128), SERVERPROPERTY('Edition')) AS edition,
    CONVERT(nvarchar(128), SERVERPROPERTY('ProductVersion')) AS product_version,
    CONVERT(nvarchar(128), SERVERPROPERTY('Collation')) AS server_collation,
    ORIGINAL_LOGIN() AS authenticated_login,
    HAS_PERMS_BY_NAME(N'master', 'DATABASE', 'CREATE DATABASE') AS can_create_database,
    DB_ID(N'TaskDira_MigrationDev') AS existing_target_database_id;

IF TRY_CONVERT(int, SERVERPROPERTY('ProductMajorVersion')) < 16
    THROW 51000, 'This migration targets SQL Server 2022 or newer.', 1;

SELECT
    ISJSON(N'"neutral"', VALUE) AS scalar_avatar_json_supported,
    ISJSON(N'{"theme":"family"}', VALUE) AS object_avatar_json_supported,
    CONVERT(datetime2(6), '2026-09-12T07:30:00.123456', 126) AS timestamp_precision_probe;
