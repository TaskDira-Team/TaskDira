IF OBJECT_ID('dbo.familyplay') IS NULL
CREATE TABLE dbo.familyplay (
    householdid int NOT NULL PRIMARY KEY REFERENCES dbo.householdinfo(id) ON DELETE CASCADE,
    document nvarchar(max) NOT NULL CHECK (ISJSON(document)=1)
);
