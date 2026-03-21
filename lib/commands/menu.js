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

    const participant = msg.key.participant || msg.key.remoteJid || from;

    // 1. Random Banner System
    const banners = [
      "https://i.ibb.co/6R22M5W/sakura-banner-placeholder-1.jpg",
      "https://i.ibb.co/3sXzPqk/sakura-banner-placeholder-2.jpg",
      "https://i.ibb.co/9vD3j0W/sakura-banner-placeholder-3.jpg"
    ];
    const randomBanner = banners[Math.floor(Math.random() * banners.length)];

    const fullMenu = `🌸 ━━━ ❨ COMMAND MENU ❩ ━━━ 🌸

🎐 User: @${participant.split('@')[0]}
🎐 Prefix: [ ${PREFIX} ]
🎐 Uptime: ${h}h ${m}m

⸻⸻⸻⸻⸻⸻⸻

『 ☁️ DOWNLOADERS 』

> ✿ 1. ${PREFIX}yt <link/keyword>
> ⏱️ YouTube (video)

> ✿ 2. ${PREFIX}yta <link/keyword>
> ⏱️ YouTube (audio)

> ✿ 3. ${PREFIX}tt <link>
> ⏱️ TikTok

> ✿ 4. ${PREFIX}ig <link>
> ⏱️ Instagram

> ✿ 5. ${PREFIX}fb <link>
> ⏱️ Facebook (hd/sd)

『 ☁️ ADULT DOWNLOADS 』

> ✿ 1. ${PREFIX}ph · ${PREFIX}xnxx · ${PREFIX}xv · ${PREFIX}xh
> ⏱️ Adult Videos

> ✿ 2. ${PREFIX}yp · ${PREFIX}sb · ${PREFIX}rt
> ⏱️ Other Adult Sites

『 ☁️ SEARCH 』

> ✿ 1. ${PREFIX}yts <keyword>
> ⏱️ YouTube Search

> ✿ 2. ${PREFIX}g <query>
> ⏱️ DuckDuckGo

> ✿ 3. ${PREFIX}wiki <topic>
> ⏱️ Wikipedia

> ✿ 4. ${PREFIX}reddit <sub>
> ⏱️ Reddit hot posts

『 ☁️ AI TOOLS 』

> ✿ 1. ${PREFIX}ai <text>
> ⏱️ AI chat proxy

> ✿ 2. ${PREFIX}img <prompt>
> ⏱️ Generate image

> ✿ 3. ${PREFIX}tts <text>
> ⏱️ Text to speech

> ✿ 4. ${PREFIX}trt <text>
> ⏱️ Translate (EN ↔ SI)

『 ☁️ GROUP CONTROL 』

> ✿ 1. ${PREFIX}kick · ${PREFIX}add · ${PREFIX}promote
> ⏱️ Member Management

> ✿ 2. ${PREFIX}lock · ${PREFIX}unlock · ${PREFIX}antilink
> ⏱️ Group Setup

『 ☁️ ECONOMY 』

> ✿ 1. ${PREFIX}balance / ${PREFIX}bal
> ⏱️ Check coins

> ✿ 2. ${PREFIX}daily
> ⏱️ Daily reward

> ✿ 3. ${PREFIX}shop / ${PREFIX}buy
> ⏱️ Coin shop

> ✿ 4. ${PREFIX}transfer @user <amount>
> ⏱️ Send coins

『 ☁️ FUN 』

> ✿ 1. ${PREFIX}joke · ${PREFIX}meme · ${PREFIX}fact
> ⏱️ Random Fun

> ✿ 2. ${PREFIX}inspire · ${PREFIX}roll · ${PREFIX}flip
> ⏱️ Mini games

『 ☁️ SYSTEM 』

> ✿ 1. ${PREFIX}ping
> ⏱️ Latency check

> ✿ 2. ${PREFIX}alive
> ⏱️ System status

> ✿ 3. ${PREFIX}update
> ⏱️ Update yt-dlp binaries

ೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;

    try {
      await sock.sendMessage(
        from,
        {
          image: { url: randomBanner },
          caption: fullMenu,
          mentions: [participant],
          contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
          },
        },
        { quoted: msg }
      );
    } catch (e) {
      // Fallback if image fails
      await sock.sendMessage(
        from,
        {
          text: fullMenu,
          mentions: [participant],
          contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
          },
        },
        { quoted: msg }
      );
    }

    await sendReact(sock, from, msg, "✅");
  },
};
