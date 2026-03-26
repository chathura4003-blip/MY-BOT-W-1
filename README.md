# 🛸 Premium MD — WhatsApp AI Bot

A production-ready, feature-rich WhatsApp bot with a Cyberpunk dashboard and advanced AI/media tooling.

## ✨ Premium Features
- **Modern Dashboard**: Glassmorphic admin panel with real-time telemetry.
- **Auto-Bio Flux**: Automated profile status updates with uptime + memory.
- **AI + Utility Commands**: Rich command set for chat, media, and admin workflows.
- **Hardened Startup Checks**: Warns on weak/default credentials and risky mode settings.
- **Smart Config Parsing**: Environment flags, ports, TTLs, and run mode are validated safely.

## Prerequisites
- Node.js **v18+** (recommended)
- ffmpeg (for media processing)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bot-Fixer.git
   cd Bot-Fixer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment config**
   ```bash
   cp .env.example .env
   ```

4. **Set secure values in `.env`**
   - `ADMIN_PASS`
   - `JWT_SECRET`
   - `OWNER_NUMBER`

5. **Run the bot**
   ```bash
   npm start
   ```

## Configuration
All runtime config is controlled in `config.js` through environment variables.

### Core
- `BOT_NAME`: Bot display name
- `OWNER_NUMBER`: Owner WhatsApp number (digits only)
- `PREFIX`: Command prefix

### Network
- `PORT`: HTTP server port
- `DASHBOARD_PORT`: Dashboard listener port

### Security
- `ADMIN_USER`: Dashboard username
- `ADMIN_PASS`: Dashboard password (**must change in production**)
- `JWT_SECRET`: Token secret (**must change in production**)

### Feature Flags
- `AUTO_READ=true|false`
- `AUTO_TYPING=true|false`
- `NSFW_ENABLED=true|false`
- `WORK_MODE=public|private`

### Performance
- `SEARCH_CACHE_TTL`
- `DOWNLOAD_CACHE_TTL`
- `MSG_CACHE_TTL`

## Dashboard
- URL: `http://localhost:<PORT>`
- Default user: `admin`
- Default password: `admin123` (only for local dev)

## Deployment Notes (Pro)
- Use strong env secrets and avoid defaults.
- Keep `WORK_MODE=private` for restricted/personal deployments.
- If ports differ (`PORT` vs `DASHBOARD_PORT`), confirm host/container mapping.
- Review startup warnings in logs before going live.

## License
MIT
