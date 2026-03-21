"use strict";

const os = require("os");
const { sendReact } = require("../utils");
const { BOT_NAME, PREFIX } = require("../../config");
const msgMgr = require("../message-manager");

module.exports = {
  name: "ping",
  aliases: ["alive", "system", "status"],
  description: "System status and ping",

  async execute(sock, msg, from, args) {
    const cmdText =
      msg?.message?.conversation ||
      msg?.message?.extendedTextMessage?.text ||
      "";
    const cmd = cmdText.trim().toLowerCase().split(/\s+/)[0].slice(1);

    switch (cmd) { // Changed from if (cmd === "ping") to switch (cmd)
      case "ping": { // Added case for ping
        await sendReact(sock, from, msg, "🏓");
        const start = Date.now();
        const sent = await sock.sendMessage(from, { text: "🏓 Pinging…" });
        const latency = Date.now() - start;
        try {
          await sock.sendMessage(from, {
            edit: sent.key,
            text: `🏓 *Pong!*\n⚡ Latency: *${latency}ms*`,
          });
        } catch {
          await msgMgr.send(sock, from, { text: `🏓 *Pong!* ${latency}ms` });
        }
        await sendReact(sock, from, msg, "✅");
        return;
      }
      case "listban": {
        const participant = msg.key.participant || msg.key.remoteJid || from;
        const bans = db.getAll("bans") || {};
        const banned = Object.keys(bans).filter((k) => bans[k]?.banned);
        if (!banned.length)
          return msgMgr.send(sock, from, { text: "✅ No banned users found." });

        let reply = `🌸 ━━━ ❨ BANNED ENTITIES ❩ ━━━ 🌸\n\n`;
        reply += `🎐 User: @${participant.split('@')[0]}\n`;
        reply += `⸻⸻⸻⸻⸻⸻⸻\n\n`;
        reply += `『 ☁️ BANNED LIST 』\n\n`;
        banned.forEach((jid, i) => {
          reply += `> ✿ ${i + 1}. @${jid.split("@")[0]}\n`;
        });
        reply += `\nೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;
        
        const mentions = [participant, ...banned];
        await sock.sendMessage(from, { text: reply, mentions, contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
        break;
      }
    } // End of switch statement

    await sendReact(sock, from, msg, "⚙️");
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    const totalMem = (os.totalmem() / 1073741824).toFixed(2);
    const usedMem = ((os.totalmem() - os.freemem()) / 1073741824).toFixed(2);
    const procMem = (process.memoryUsage().rss / 1048576).toFixed(1);

    const participant = msg.key.participant || msg.key.remoteJid || from;

    let reply = `🌸 ━━━ ❨ SYSTEM CORE ❩ ━━━ 🌸\n\n`;
    reply += `🎐 User: @${participant.split('@')[0]}\n`;
    reply += `🎐 Uptime: ${h}h ${m}m ${s}s\n`;
    reply += `🎐 Prefix: [ ${PREFIX} ]\n`;
    reply += `⸻⸻⸻⸻⸻⸻⸻\n\n`;
    reply += `『 ☁️ HARDWARE SPECS 』\n\n`;
    reply += `> ✿ Memory\n`;
    reply += `> ⏱️ ${usedMem}GB / ${totalMem}GB\n\n`;
    reply += `> ✿ Process RSS\n`;
    reply += `> ⏱️ ${procMem}MB\n\n`;
    reply += `> ✿ Platform\n`;
    reply += `> ⏱️ ${os.type()} ${os.arch()}\n\n`;
    reply += `『 ☁️ STATUS 』\n\n`;
    reply += `> ✿ All systems operational ✅\n\n`;
    reply += `ೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;

    await sock.sendMessage(from, { text: reply, mentions: [participant], contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
    await sendReact(sock, from, msg, "✅");
  },
};
