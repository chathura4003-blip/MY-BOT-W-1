# Modular WhatsApp Bot (Baileys MD)

Refactored Node.js WhatsApp bot with a modular architecture, JSON storage, dynamic commands/plugins/events, admin API, and real-time dashboard.

## Folder Structure

```
.
├── api/                 # Express API + Socket.IO
├── commands/            # Reserved for custom command handlers
├── config/              # App configuration modules
├── core/                # Core engine (session, queue, events, logging, command manager)
├── data/                # JSON storage (commands, users, sessions, logs, analytics, etc.)
├── events/              # Event modules (message/command/join/leave listeners)
├── panel/               # Admin dashboard static web UI
├── plugins/             # Feature plugins (enable/disable at runtime)
├── sessions/            # Baileys multi-session auth directories
├── bot.js               # Backward-compatible bot bootstrap wrapper
└── index.js             # App entrypoint
```

## Features

- Modular core engine (session manager, command manager, plugin manager, event bus)
- JSON-driven command system with:
  - permissions (`user`, `admin`, `group`)
  - cooldowns
  - categories
  - runtime updates without restart (`commands.json` watched)
- Plugin system (`plugins/*.js`) with dynamic enable/disable via API
- Event system (`events/*.js`) with runtime toggles
- Admin API (Express):
  - auth (JWT)
  - status, logs, commands, plugins, events
  - send message + broadcast queue
  - restart bot
  - multi-session add/remove
- Admin Panel (web dashboard) for login, status, commands/plugins view, broadcast, live logs
- Real-time events via Socket.IO
- Multi-device / multi-session using Baileys auth folders
- Logging + analytics in JSON files
- Optional AI auto-reply rules (`data/ai-rules.json`)
- No external DB (JSON-only persistence)

## JSON Storage Files

- `data/commands.json`
- `data/users.json`
- `data/sessions.json`
- `data/logs.json`
- `data/plugins.json`
- `data/events.json`
- `data/analytics.json`
- `data/ai-rules.json`

## Run

```bash
npm install
npm start
```

Open panel:
- `http://localhost:5000`

Default login:
- username: `owner`
- password: `owner123`

> Change credentials via env: `ADMIN_USER`, `ADMIN_PASS`, `JWT_SECRET`.

## Termux / VPS Notes

- Works on low-resource deployments (in-memory queue + JSON storage).
- No Redis / SQL required.
- Sessions are persisted under `sessions/<sessionId>/`.
