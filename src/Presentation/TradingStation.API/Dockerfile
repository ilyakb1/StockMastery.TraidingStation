# Stage 1: Build
FROM mcr.microsoft.com/dotnet/nightly/sdk:10.0-preview AS build
WORKDIR /src

# Copy all project files
COPY src/Core/TradingStation.Contracts/*.csproj ./src/Core/TradingStation.Contracts/
COPY src/Core/TradingStation.Domain/*.csproj ./src/Core/TradingStation.Domain/
COPY src/Core/TradingStation.TradingEngine/*.csproj ./src/Core/TradingStation.TradingEngine/
COPY src/Application/TradingStation.Application/*.csproj ./src/Application/TradingStation.Application/
COPY src/Application/TradingStation.Backtesting/*.csproj ./src/Application/TradingStation.Backtesting/
COPY src/Infrastructure/TradingStation.Infrastructure/*.csproj ./src/Infrastructure/TradingStation.Infrastructure/
COPY src/Infrastructure/TradingStation.Data.Backtesting/*.csproj ./src/Infrastructure/TradingStation.Data.Backtesting/
COPY src/Presentation/TradingStation.API/*.csproj ./src/Presentation/TradingStation.API/

# Restore dependencies for API project only (avoids missing test projects)
RUN dotnet restore ./src/Presentation/TradingStation.API/TradingStation.API.csproj

# Copy everything else and build
COPY src/ ./src/
WORKDIR /src/src/Presentation/TradingStation.API
RUN dotnet build -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/nightly/aspnet:10.0-preview AS runtime
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Copy published files
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Docker

ENTRYPOINT ["dotnet", "TradingStation.API.dll"]
