@echo off
cd /d "%~dp0..\.."

echo === Rock City PMS — Seeding Database ===

rem Find DATABASE_URL in .env
for /f "usebackq tokens=1,2 delims==" %%i in (".env") do (
    if "%%i"=="DATABASE_URL" set DB_URL=%%j
)

if "%DB_URL%"=="" (
    echo Error: DATABASE_URL not found in .env file!
    pause
    exit /b 1
)

echo Seeding anonymous guest...
call psql "%DB_URL%" -f backend/seed-anonymous-guest.sql
if errorlevel 1 goto fail

echo Seeding rooms...
call psql "%DB_URL%" -f backend/seed-rooms.sql
if errorlevel 1 goto fail

echo.
echo Database seeded successfully!
pause
exit /b 0

:fail
echo.
echo Seeding failed. Make sure psql is in your PATH and the database is running.
pause
exit /b 1
