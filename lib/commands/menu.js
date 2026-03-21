"use strict";

const path = require("path");
const { BOT_NAME, PREFIX, OWNER_NUMBER } = require("../../config");
const { sendReact } = require("../utils");
const msgMgr = require("../message-manager");

const LOGO = path.join(__dirname, "../../supreme_bot_logo.png");

module.exports = {
  name: "menu",
  aliases: ["help", "allmenu", "commands", "list", "start"],
  description: "Bot command menu",

  async execute(sock, msg, from) {
    await sendReact(sock, from, msg, "📜");

    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);

    const { theme } = require("../utils");
    const { toFancy } = require("../premium");

    let fullMenu = theme.header(toFancy("Command List"), "📜") + "\n";
    fullMenu += theme.field("Prefix", `[ ${PREFIX} ]`, "🤖") + "\n";
    fullMenu += theme.field("Uptime", `${h}h ${m}m`, "⏱️") + "\n";
    fullMenu += theme.divider + "\n";

    fullMenu += theme.line("*📥 DOWNLOADERS*") + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}yt  <link/keyword> — YouTube (video)`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}yta <link/keyword> — YouTube (audio)`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}tt  <link>         — TikTok`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}ig  <link>         — Instagram`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}fb  <link>         — Facebook`) + "\n";
    fullMenu += theme.line("_(Flags: hd · sd · low)_") + "\n";
    fullMenu += theme.divider + "\n";

    fullMenu += theme.line("*🔞 ADULT DOWNLOADS*") + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}ph · ${PREFIX}xnxx · ${PREFIX}xv · ${PREFIX}xh`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}yp · ${PREFIX}sb · ${PREFIX}rt`) + "\n";
    fullMenu += theme.line(`_(Usage: .ph <link or keyword>)_`) + "\n";
    fullMenu += theme.divider + "\n";

    fullMenu += theme.line("*🔍 SEARCH*") + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}yts   <keyword> — YouTube`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}g     <query>   — DuckDuckGo`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}wiki  <topic>   — Wikipedia`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}reddit <sub>    — Reddit hot posts`) + "\n";
    fullMenu += theme.divider + "\n";

    fullMenu += theme.line("*🤖 AI TOOLS*") + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}ai  <text> — AI chat proxy`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}img <prompt> — Generate image`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}tts <text>   — Text to speech`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}trt <text>   — Translate (EN ↔ SI)`) + "\n";
    fullMenu += theme.divider + "\n";

    fullMenu += theme.line("*👑 GROUP CONTROL*") + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}kick · ${PREFIX}add · ${PREFIX}promote · ${PREFIX}demote`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}lock · ${PREFIX}unlock · ${PREFIX}antilink`) + "\n";
    fullMenu += theme.divider + "\n";

    fullMenu += theme.line("*💰 ECONOMY*") + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}balance / ${PREFIX}bal — Check coins`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}daily — Daily reward`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}shop / ${PREFIX}buy — Coin shop`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}transfer @user <amount>`) + "\n";
    fullMenu += theme.divider + "\n";

    fullMenu += theme.line("*🎲 FUN*") + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}joke · ${PREFIX}meme · ${PREFIX}fact`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}inspire · ${PREFIX}roll · ${PREFIX}flip`) + "\n";
    fullMenu += theme.divider + "\n";

    fullMenu += theme.line("*📊 SYSTEM*") + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}ping   — Latency check`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}alive  — System status`) + "\n";
    fullMenu += theme.line(`✦ ${PREFIX}update — Update yt-dlp binaries (Owner)`) + "\n";
    fullMenu += theme.footer();

    try {
      const fs = require("fs");
      if (fs.existsSync(LOGO)) {
        await sock.sendMessage(from, {
          image: { url: LOGO },
          caption: fullMenu,
        });
      } else {
        await msgMgr.send(sock, from, { text: fullMenu });
      }
    } catch {
      await msgMgr.send(sock, from, { text: fullMenu });
    }

    await sendReact(sock, from, msg, "✅");
  },
};
