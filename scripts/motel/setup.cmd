@echo off
REM First-time pm2 setup on the on-site server — run from repo root (CMD)
cd /d "%~dp0..\.."

echo === Rock City PMS — pm2 setup ===
echo Close any old backend/frontend CMD windows first (EADDRINUSE).
pause

echo Installing root pm2...
call npm install

echo Installing backend + frontend deps...
cd backend
call npm install
cd ..\frontend
call npm install
call npm run build
cd ..

echo Starting pm2 apps...
call npx pm2 start ecosystem.config.cjs
call npx pm2 status

echo.
echo === Next (once, as Administrator CMD) ===
echo   npm install --global pm2-windows-startup
echo   pm2-startup install
echo   npx pm2 save
echo.
echo Health: http://localhost:3000/health
echo Staff UI: http://YOUR-LAN-IP:5173
pause
