@echo off
REM Pull latest + rebuild + restart on the on-site server
cd /d "%~dp0..\.."

echo === Rock City PMS — update ===

echo [1/5] git pull...
git pull
if errorlevel 1 (
  echo git pull failed. Fix conflicts, then re-run.
  pause
  exit /b 1
)

echo [2/5] backend npm install...
cd backend
call npm install
if errorlevel 1 goto fail

echo [3/5] migrations (if any new)...
call npx drizzle-kit migrate
if errorlevel 1 (
  echo Migration failed — check DATABASE_URL and stop if unsure.
  pause
  exit /b 1
)
cd ..

echo [4/5] frontend install + build...
cd frontend
call npm install
call npm run build
if errorlevel 1 goto fail
cd ..

echo [5/5] pm2 restart...
call npx pm2 restart ecosystem.config.cjs
call npx pm2 status

echo.
echo Done. Check http://localhost:3000/health
echo Staff bookmark should still work if the LAN IP is unchanged.
pause
exit /b 0

:fail
echo Update failed. See errors above.
pause
exit /b 1
