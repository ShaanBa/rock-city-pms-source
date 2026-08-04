@echo off
cd /d "%~dp0..\.."
call npx pm2 restart ecosystem.config.cjs
call npx pm2 status
