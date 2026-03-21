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

    if (cmd === "ping") {
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

    await sendReact(sock, from, msg, "⚙️");
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    const totalMem = (os.totalmem() / 1073741824).toFixed(2);
    const usedMem = ((os.totalmem() - os.freemem()) / 1073741824).toFixed(2);
    const procMem = (process.memoryUsage().rss / 1048576).toFixed(1);

    const { theme } = require("../utils");
    const reply =
      theme.header("System Status", "⚡") +
      "\n" +
      theme.field("Uptime", `${h}h ${m}m ${s}s`, "⏱️") +
      "\n" +
      theme.field("RAM", `${usedMem}GB / ${totalMem}GB`, "💾") +
      "\n" +
      theme.field("Process", `${procMem}MB RSS`, "🔧") +
      "\n" +
      theme.field("OS", `${os.type()} ${os.arch()}`, "🖥️") +
      "\n" +
      theme.field("Prefix", `[ ${PREFIX} ]`, "🤖") +
      "\n" +
      theme.divider +
      "\n" +
      theme.line("_All systems operational_ ✅") +
      "\n" +
      theme.footer();

    await msgMgr.send(sock, from, { text: reply });
    await sendReact(sock, from, msg, "✅");
  },
};
