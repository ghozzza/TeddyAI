// PM2 process config — runs the web app + the autonomous worker side by side.
//   pm2 start deploy/ecosystem.config.cjs && pm2 save
// Both processes load .env from the repo root (Next + dotenv).
const path = require("node:path");
const cwd = path.resolve(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "pekka-web",
      cwd,
      script: "pnpm",
      args: "start",
      interpreter: "none",
      // 3000/3001 are taken by the co-located WallCup apps on this box.
      env: { PORT: process.env.PEKKA_PORT || "3002" },
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: "pekka-worker",
      cwd,
      script: "pnpm",
      args: "worker",
      interpreter: "none",
      autorestart: true,
      // Worker loops on AGENT_INTERVAL; restart if it ever exits.
      max_restarts: 20,
      restart_delay: 5000,
    },
  ],
};
