# 🛸 Premium MD — WhatsApp AI Bot

A production-minded WhatsApp bot built on **Baileys**, with an admin dashboard, moderation utilities, automation commands, media/download workflows, and AI integrations.

## 🚀 Highlights
- **Real-time Dashboard** for connection status, QR login, logs, network speed, and moderation controls.
- **Command Modules** split by domain (`ai`, `group`, `download`, `search`, `economy`, `owner`, etc.).
- **Persistent Local Storage** for bans/mods and runtime bot state.
- **Media Tooling** via ffmpeg + yt-dlp wrapper support.
- **Deploy-ready** setup for local, Docker, Render, and Procfile-based environments.

## 🧱 Tech Stack
- Node.js (CommonJS)
- `@whiskeysockets/baileys`
- Express dashboard + Socket tooling
- `systeminformation` for host metrics
- `yt-dlp-wrap` for download workflows

## ✅ Prerequisites
- **Node.js 18+** recommended (Node 16 may run but 18+ is safer for modern deps).
- **ffmpeg** installed and available in PATH.

## 📦 Installation
```bash
git clone https://github.com/YOUR_USERNAME/Bot-Fixer.git
cd Bot-Fixer
npm install
```

## ⚙️ Configuration
Create and edit your env file:
```bash
cp .env.example .env
```

Core values:
- `OWNER_NUMBER` → WhatsApp number in international format (digits only).
- `PREFIX` → command prefix (default: `.`).
- `BOT_NAME` → visible bot name.
- `ADMIN_USER` / `ADMIN_PASS` → dashboard basic-auth credentials.
- `JWT_SECRET` → rotate for production use.

> **Security note:** Never keep default dashboard credentials in production.

## ▶️ Run
```bash
npm start
```

For development:
```bash
npm run dev
```

## 🖥️ Dashboard
- URL: `http://localhost:5000` (or your configured `PORT`/`DASHBOARD_PORT`)
- Auth: HTTP Basic Auth using `ADMIN_USER` and `ADMIN_PASS` from `.env`

Main endpoints exposed in dashboard router:
- `GET /api/status`
- `GET /api/qr`
- `GET /api/logs?limit=100`
- `GET /api/speed`
- `GET/POST/DELETE /api/mods`
- `GET/POST/DELETE /api/bans`
- `POST /api/restart`
- `POST /api/logout`

## 🐳 Docker
A Dockerfile is included:
```bash
docker build -t premium-md .
docker run --env-file .env -p 5000:5000 premium-md
```

## 🧪 Health & Ops Tips
- Ensure persistent volume mapping for session/database files when deploying.
- Keep `OWNER_NUMBER` and admin secrets in environment variables, not hardcoded.
- Rotate auth credentials periodically.
- Monitor memory/uptime from the dashboard and restart gracefully when needed.

## 📄 License
MIT
