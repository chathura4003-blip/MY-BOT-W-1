"use strict";

const axios = require("axios");
const { sendReact } = require("../utils");
const msgMgr = require("../message-manager");
const { handleAPIError } = require("../error-handler");

const JOKE_API = "https://v2.jokeapi.dev/joke/Any?safe-mode";
const FACT_API = "https://uselessfacts.jsph.pl/random.json?language=en";
const MEME_API = "https://meme-api.com/gimme";
const INSPIRE_API = "https://zenquotes.io/api/random";

module.exports = {
  name: "joke",
  aliases: ["meme", "fact", "inspire", "quote", "roll", "flip"],
  description: "Fun commands",

  async execute(sock, msg, from, args) {
    const cmdText =
      msg?.message?.conversation ||
      msg?.message?.extendedTextMessage?.text ||
      "";
    const cmd = cmdText.trim().toLowerCase().split(/\s+/)[0].slice(1);

    await sendReact(sock, from, msg, "🎲");
    await require("../utils").presenceUpdate(sock, from, "composing");

    const participant = msg.key.participant || msg.key.remoteJid || from;

    try {
      switch (cmd) {
        case "joke": {
          const { data } = await axios.get(JOKE_API, { timeout: 8000 });
          let text = `🌸 ━━━ ❨ JOKE ❩ ━━━ 🌸\n\n`;
          text += `🎐 User: @${participant.split('@')[0]}\n`;
          text += `⸻⸻⸻⸻⸻⸻⸻\n\n`;
          text += `『 ☁️ FUN JOKE 』\n\n`;
          if (data.type === "twopart") {
            text += `> ✿ Q. ${data.setup}\n`;
            text += `> ⏱️ ${data.delivery}\n\n`;
          } else {
            text += `> ✿ 1. ${data.joke}\n\n`;
          }
          text += `ೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;
          await sock.sendMessage(from, { text, mentions: [participant], contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
          break;
        }

        case "meme": {
          const { data } = await axios.get(MEME_API, { timeout: 10000 });
          if (!data?.url) throw new Error("No meme URL");
          let caption = `🌸 ━━━ ❨ MEME ❩ ━━━ 🌸\n\n`;
          caption += `🎐 User: @${participant.split('@')[0]}\n`;
          caption += `🎐 Upvotes: ${data.ups || 0}\n`;
          caption += `⸻⸻⸻⸻⸻⸻⸻\n\n`;
          caption += `『 ☁️ MEME ZONE 』\n\n`;
          caption += `> ✿ 1. ${data.title || "Random Meme"}\n\n`;
          caption += `ೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;
          
          await sock.sendMessage(from, {
            image: { url: data.url },
            caption,
            mentions: [participant],
            contextInfo: { isForwarded: true, forwardingScore: 999 }
          }, { quoted: msg });
          break;
        }

        case "fact": {
          const { data } = await axios.get(FACT_API, { timeout: 8000 });
          let text = `🌸 ━━━ ❨ RANDOM FACT ❩ ━━━ 🌸\n\n`;
          text += `🎐 User: @${participant.split('@')[0]}\n`;
          text += `⸻⸻⸻⸻⸻⸻⸻\n\n`;
          text += `『 ☁️ DID YOU KNOW? 』\n\n`;
          text += `> ✿ 1. ${data.text}\n\n`;
          text += `ೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;
          await sock.sendMessage(from, { text, mentions: [participant], contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
          break;
        }

        case "inspire":
        case "quote": {
          const { data } = await axios.get(INSPIRE_API, { timeout: 8000 });
          const q = Array.isArray(data) ? data[0] : data;
          let text = `🌸 ━━━ ❨ QUOTE OF THE DAY ❩ ━━━ 🌸\n\n`;
          text += `🎐 User: @${participant.split('@')[0]}\n`;
          text += `⸻⸻⸻⸻⸻⸻⸻\n\n`;
          text += `『 ☁️ INSPIRATION 』\n\n`;
          text += `> ✿ "${q.q}"\n`;
          text += `> ⏱️ — ${q.a}\n\n`;
          text += `ೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;
          await sock.sendMessage(from, { text, mentions: [participant], contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
          break;
        }

        case "roll": {
          const max = parseInt(args[0]) || 6;
          const roll = Math.floor(Math.random() * max) + 1;
          let text = `🌸 ━━━ ❨ DICE ROLL ❩ ━━━ 🌸\n\n`;
          text += `🎐 User: @${participant.split('@')[0]}\n`;
          text += `🎐 Max Range: ${max}\n`;
          text += `⸻⸻⸻⸻⸻⸻⸻\n\n`;
          text += `『 ☁️ RNG RESULT 』\n\n`;
          text += `> ✿ 🎲 The dice rolled: ${roll}\n\n`;
          text += `ೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;
          await sock.sendMessage(from, { text, mentions: [participant], contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
          break;
        }

        case "flip": {
          const r = Math.random() > 0.5 ? "🟡 Heads" : "⚪ Tails";
          let text = `🌸 ━━━ ❨ COIN FLIP ❩ ━━━ 🌸\n\n`;
          text += `🎐 User: @${participant.split('@')[0]}\n`;
          text += `⸻⸻⸻⸻⸻⸻⸻\n\n`;
          text += `『 ☁️ RNG RESULT 』\n\n`;
          text += `> ✿ 🪙 The coin landed on: ${r}\n\n`;
          text += `ೃ⁀➷ 💮 CHATHU MD 💮 ೃ⁀➷`;
          await sock.sendMessage(from, { text, mentions: [participant], contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
          break;
        }

        default:
          await msgMgr.sendTemp(sock, from, "❓ Unknown fun command.", 4000);
      }

      await sendReact(sock, from, msg, "✅");
    } catch (err) {
      const fe = handleAPIError(err, "Fun");
      await msgMgr.sendTemp(sock, from, `❌ ${fe.message}`, 5000);
      await sendReact(sock, from, msg, "❌");
    }
  },
};
