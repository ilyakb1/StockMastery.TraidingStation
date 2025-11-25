-- Trading Station Database Initialization Script
-- This script is run when the SQL Server container starts for the first time

USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TradingStation')
BEGIN
    CREATE DATABASE TradingStation;
    PRINT 'Database TradingStation created successfully.';
END
ELSE
BEGIN
    PRINT 'Database TradingStation already exists.';
END
GO

USE TradingStation;
GO

-- The Entity Framework migrations will handle the schema creation
-- This script just ensures the database exists
PRINT 'Database initialization complete. Ready for EF Core migrations.';
GO
