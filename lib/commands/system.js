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
        const bans = db.getAll("bans") || {};
        const banned = Object.keys(bans).filter((k) => bans[k]?.banned);
        const { theme } = require("../utils");
        const { toFancy } = require("../premium");
        if (!banned.length)
          return msgMgr.send(sock, from, { text: "✅ No banned users found." });
        let reply = theme.header(toFancy("Banned Entities"), "🚫") + "\n";
        banned.forEach((jid, i) => {
          reply += theme.line(`${i + 1}. @${jid.split("@")[0]}`) + "\n";
        });
        reply += theme.footer();
        await msgMgr.send(sock, from, { text: reply, mentions: banned });
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

    const { theme } = require("../utils");
    const { toFancy } = require("../premium");
    const reply =
      theme.header(toFancy("System Core"), "⚡") +
      "\n" +
      theme.field(toFancy("Uptime"), `${h}h ${m}m ${s}s`, "⏱️") +
      "\n" +
      theme.field(toFancy("Memory"), `${usedMem}GB / ${totalMem}GB`, "💾") +
      "\n" +
      theme.field(toFancy("Process"), `${procMem}MB RSS`, "🔧") +
      "\n" +
      theme.field(toFancy("Platform"), `${os.type()} ${os.arch()}`, "🖥️") +
      "\n" +
      theme.field(toFancy("Prefix"), `[ ${PREFIX} ]`, "🤖") +
      "\n" +
      theme.divider +
      "\n" +
      theme.line(toFancy("_All systems operational_ ✅")) +
      "\n" +
      theme.footer();

    await msgMgr.send(sock, from, { text: reply });
    await sendReact(sock, from, msg, "✅");
  },
};
