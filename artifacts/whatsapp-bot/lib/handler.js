"use strict";

const fs = require("fs");
const path = require("path");
const { logger } = require("../logger");
const { MemoryCache } = require("./memory-cache");
const { handleAPIError, safeExecute } = require("./error-handler");
const { getMetadata, downloadAndSend } = require("./download-manager");
const msgMgr = require("./message-manager");
const { sendReact, presenceUpdate, truncate, isOwner } = require("./utils");
const { BOT_NAME, PREFIX } = require("../config");
const db = require("./db");

const commands = new Map();

const searchResults = new MemoryCache(600000);
const lastSearch = new MemoryCache(600000);
const qualitySelection = new MemoryCache(300000);

function loadCommands() {
  const dir = path.join(__dirname, "commands");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
    try {
      const cmdPath = path.join(dir, file);
      delete require.cache[require.resolve(cmdPath)];
      const cmd = require(cmdPath);
      if (!cmd.name || typeof cmd.execute !== "function") continue;
      commands.set(cmd.name, cmd);
      (cmd.aliases || []).forEach((a) => commands.set(a, cmd));
    } catch (err) {
      logger(`[Handler] Failed to load ${file}: ${err.message}`);
    }
  }
  logger(`[Handler] Loaded ${commands.size} commands`);
}

function storeSearchResults(msgId, sender, results) {
  if (!msgId || !sender || !Array.isArray(results)) return;
  const entry = { results, sender };
  searchResults.set(`${sender}:${msgId}`, entry, 600000);
  lastSearch.set(sender, { results, msgId }, 600000);
}

async function showQualityMenu(sock, from, meta, sender) {
  if (!sock || !from || !meta) return;

  qualitySelection.set(sender, { meta }, 300000);

  const sizeStr = meta.filesize
    ? `${(meta.filesize / (1024 * 1024)).toFixed(1)} MB`
    : "Calculating…";

  const { theme } = require("./utils");
  const menuText =
    theme.header("VIDEO READY", "🎬") + "\n" +
    theme.field("Title", truncate(meta.title, 45), "📝") + "\n" +
    theme.field("Duration", meta.duration || "?", "⏱️") + "\n" +
    theme.field("Size", sizeStr, "📦") + "\n" +
    theme.divider + "\n" +
    theme.line("1️⃣ HD  |  2️⃣ SD  |  3️⃣ Audio", "💎") + "\n" +
    theme.divider + "\n" +
    theme.line("_Reply 1, 2, or 3 to download_") + "\n" +
    theme.footer();

  const buttons = [
    {
      buttonId: `${PREFIX}yt hd ${meta.url}`,
      buttonText: { displayText: "1️⃣ HD" },
      type: 1,
    },
    {
      buttonId: `${PREFIX}yt sd ${meta.url}`,
      buttonText: { displayText: "2️⃣ SD" },
      type: 1,
    },
    {
      buttonId: `${PREFIX}yta ${meta.url}`,
      buttonText: { displayText: "3️⃣ Audio" },
      type: 1,
    },
  ];

  const content = {
    buttons,
    footer: `⚡ ${BOT_NAME} Downloader`,
  };

  if (meta.thumbnail) {
    content.image = { url: meta.thumbnail };
    content.caption = menuText;
  } else {
    content.text = menuText;
  }

  try {
    await msgMgr.send(sock, from, content);
  } catch {
    await msgMgr.send(sock, from, { text: menuText });
  }
}

async function handleCommand(sock, msg, from, text) {
  if (!msg?.key || !from) return false;

  try {
    let sender = msg.key.participant || msg.key.remoteJid;
    if (sender?.includes(":")) {
      sender =
        sender.split(":")[0] +
        (sender.endsWith("@s.whatsapp.net") ? "@s.whatsapp.net" : "");

      if (msg.key.participant) msg.key.participant = sender;
      else if (msg.key.remoteJid?.endsWith("@s.whatsapp.net"))
        msg.key.remoteJid = sender;
    }

    const listResp = msg.message?.listResponseMessage;
    const rowId = listResp?.singleSelectReply?.selectedRowId;
    if (rowId?.startsWith("pick:")) {
      const idx = parseInt(rowId.replace("pick:", ""), 10);
      const entry = lastSearch.get(sender);
      if (entry && !isNaN(idx) && entry.results?.[idx]) {
        const meta =
          (await safeExecute(
            () => getMetadata(entry.results[idx].url),
            "GetMetadata",
          )) || entry.results[idx];
        await showQualityMenu(sock, from, meta, sender);
        return true;
      }
    }

    if (!text) {
      const btnResp =
        msg.message?.buttonsResponseMessage ||
        msg.message?.templateButtonReplyMessage;
      const btnId = btnResp?.selectedButtonId || btnResp?.selectedId;
      if (btnId) {
        return await handleCommand(sock, msg, from, btnId);
      }
    }

    const cmdText =
      text ||
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";

    if (!cmdText) return false;

    const lower = cmdText.trim().toLowerCase();

    if (/^\d+$/.test(lower)) {
      const num = parseInt(lower, 10);
      const idx = num - 1;

      logger(`[Handler] Captured numeric reply: ${num} from ${sender}`);

      const qEntry = qualitySelection.get(sender);
      if (qEntry && num >= 1 && num <= 3) {
        const { meta } = qEntry;
        sendReact(sock, from, msg, "⏳");
        presenceUpdate(sock, from, num === 3 ? "recording" : "composing");
        try {
          const quality = num === 1 ? "hd" : "sd";
          const isAudio = num === 3;
          await downloadAndSend(
            sock,
            from,
            meta.url,
            meta.source || "Media",
            quality,
            isAudio,
          );
          await sendReact(sock, from, msg, "✅");
          qualitySelection.delete(sender);
        } catch (err) {
          const fe = handleAPIError(err, "QualityDownload");
          await msgMgr.sendTemp(sock, from, `❌ ${fe.message}`, 5000);
          await sendReact(sock, from, msg, "❌");
        }
        return true;
      }

      const ctxId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
      const key = ctxId ? `${sender}:${ctxId}` : null;
      const entry = (key && searchResults.get(key)) || lastSearch.get(sender);
      if (entry && idx >= 0 && idx < entry.results.length) {
        sendReact(sock, from, msg, "🎬");
        const meta =
          (await safeExecute(
            () => getMetadata(entry.results[idx].url),
            "GetMetadataFromSearch",
          )) || entry.results[idx];
        await showQualityMenu(sock, from, meta, sender);
        return true;
      }
    }

    if (cmdText.startsWith(PREFIX + "mode")) {
      if (!msg.key.fromMe && !isOwner(sender)) return false;
      const newMode = cmdText.split(/\s+/)[1]?.toLowerCase();
      if (["public", "private", "self"].includes(newMode)) {
        db.setSetting("work_mode", newMode);
        await msgMgr.send(sock, from, {
          text: `✅ Work mode changed to: *${newMode.toUpperCase()}*`,
        });
        return true;
      } else {
        await msgMgr.sendTemp(
          sock,
          from,
          `⚠️ Usage: .mode [public|private|self]`,
          5000,
        );
        return true;
      }
    }

    if (!cmdText.startsWith(PREFIX)) return false;

    const workMode = db.getSetting("work_mode") || "public";
    const isSelf = msg.key.fromMe || isOwner(sender);
    if (!isSelf) {
      if (workMode === "self") return false;
      if (workMode === "private" && from.endsWith("@g.us")) return false;
    }

    const args = cmdText.slice(PREFIX.length).trim().split(/\s+/);
    const name = args.shift()?.toLowerCase();
    if (!name) return false;

    const cmd = commands.get(name);
    if (!cmd) {
      logger(`[Handler] Command not found: ${name}`);
      return false;
    }

    logger(`[Handler] Executing: ${name} (from: ${from})`);
    try {
      await cmd.execute(sock, msg, from, args);
    } catch (err) {
      logger(`[Command/${name}] ${err.message}`);
      await msgMgr.sendTemp(
        sock,
        from,
        "❌ Command error. Please try again.",
        4000,
      );
    }
    return true;
  } catch (err) {
    logger(`[Handler] Unexpected: ${err.message}`);
    return false;
  }
}

module.exports = {
  loadCommands,
  handleCommand,
  storeSearchResults,
  showQualityMenu,
};
