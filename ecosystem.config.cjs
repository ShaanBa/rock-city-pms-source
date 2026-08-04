/**
 * pm2 process configuration for an on-site Windows server
 *
 * First time (repo root, CMD or Git Bash):
 *   1. Close old manual CMD windows (avoids EADDRINUSE)
 *   2. scripts\motel\setup.cmd
 *
 * Daily update after git push:
 *   scripts\motel\update.cmd
 */
module.exports = {
  apps: [
    {
      name: 'pms-api',
      cwd: './backend',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'watch src/index.ts',
      env: {
        PORT: '3000',
      },
      windowsHide: true,
      max_restarts: 15,
      restart_delay: 2000,
    },
    {
      name: 'pms-ui',
      cwd: './frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --host 0.0.0.0 --port 5173',
      windowsHide: true,
      max_restarts: 15,
      restart_delay: 2000,
    },
  ],
};
