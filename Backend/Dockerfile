FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app
COPY src/TaskDira.Api/TaskDira.Api.csproj src/TaskDira.Api/
RUN dotnet restore src/TaskDira.Api/TaskDira.Api.csproj
COPY src/TaskDira.Api/ src/TaskDira.Api/
RUN dotnet publish src/TaskDira.Api/TaskDira.Api.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "TaskDira.Api.dll"]
