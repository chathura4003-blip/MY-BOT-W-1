# Modular WhatsApp Bot (Baileys + JSON + Admin Panel)

Refactored Node.js WhatsApp bot with a modular architecture and **no external database**.

## Architecture

- `core/engine/` - WhatsApp runtime + multi-session bot engine
- `core/services/` - JSON storage, auth, commands, plugins, events, logs, queue
- `core/api/` - Express API + Socket.IO server
- `plugins/` - Feature plugins (enable/disable from panel/API)
- `events/` - Event hooks (`message.received`, `group.participant`, `command.executed`)
- `config/` - App configuration
- `data/` - JSON persistence
- `public/` - Admin web dashboard

## JSON Storage Files

- `data/commands.json`
- `data/users.json`
- `data/sessions.json`
- `data/logs.json`
- `data/events.json`
- `data/ai-rules.json`

## Features Implemented

- Dynamic command system from JSON (category, permission, cooldown, enabled flag)
- Plugin system with runtime enable/disable
- Event system with toggles and custom handlers
- Admin API with JWT + RBAC (Owner/Admin/Moderator)
- Real-time logs/status over Socket.IO
- Multi-session support (add/remove sessions, QR retrieval)
- In-memory queue for broadcast tasks
- Optional AI auto-reply rules from JSON
- Legacy command compatibility bridge plugin to keep existing `lib/commands/*` behavior working while migrating.
- Lightweight and compatible with VPS/Termux (file-based JSON storage)

## Setup

```bash
npm install
npm start
npm test
```

Open dashboard at:

- `http://localhost:5000`
- or set `PUBLIC_BASE_URL` (example: `https://your-domain.com`) so logs/API return your shareable link.

Default login is loaded from `ADMIN_USER` / `ADMIN_PASS` environment variables on first run.

## Main API Examples

- `POST /api/auth/login`
- `GET /api/status`
- `GET/POST/DELETE /api/commands`
- `GET/PATCH /api/plugins/:id`
- `GET/PATCH /api/events/:name`
- `GET/POST/PATCH/DELETE /api/sessions`
- `GET /api/sessions/:id/qr`
- `POST /api/messages/send`
- `POST /api/messages/broadcast`
- `GET/PUT /api/ai-rules`
- `POST /api/restart`

## Notes

- This refactor keeps the project Node.js + Baileys based and moves it to a scalable modular engine.
- Existing files are preserved, while `index.js` now boots the new modular runtime.
