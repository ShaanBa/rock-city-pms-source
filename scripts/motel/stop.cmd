@echo off
cd /d "%~dp0..\.."
call npx pm2 stop ecosystem.config.cjs
call npx pm2 status
