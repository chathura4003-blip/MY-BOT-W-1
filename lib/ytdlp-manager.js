"use strict";

const fs = require("fs");
const { execSync } = require("child_process");
const YTDlpWrap = require("yt-dlp-wrap").default;
const ffmpegStatic = require("ffmpeg-static");
const fluentFfmpeg = require("fluent-ffmpeg");
const { logger } = require("../logger");

// Railway Linux path
const YT_DLP_PATH = "/usr/local/bin/yt-dlp";
let FFMPEG_PATH = null;

(async function detectFfmpeg() {
  const candidates = [
    process.env.FFMPEG_PATH,
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    ffmpegStatic,
  ].filter(Boolean);

  for (const path of candidates) {
    if (fs.existsSync(path)) {
      FFMPEG_PATH = path;
      break;
    }
  }

  if (FFMPEG_PATH) {
    fluentFfmpeg.setFfmpegPath(FFMPEG_PATH);
    logger(`[ffmpeg] ✅ Using: ${FFMPEG_PATH}`);
  } else {
    logger("[ffmpeg] ⚠️ WARNING: ffmpeg not found");
  }
})();

async function ensureYtdlp() {
  // Step 1: Already exists da?
  if (fs.existsSync(YT_DLP_PATH)) {
    try {
      const version = execSync(`${YT_DLP_PATH} --version`, { encoding: "utf8" }).trim();
      logger(`[yt-dlp] ✅ Ready → v${version}`);
      return true;
    } catch (e) {}
  }

  // Step 2: Railway eke nathnam runtime download (fail-safe)
  logger("[yt-dlp] ⚠️ Binary missing → Downloading now...");
  try {
    execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${YT_DLP_PATH}`, { stdio: "pipe" });
    execSync(`chmod +x ${YT_DLP_PATH}`, { stdio: "pipe" });

    const version = execSync(`${YT_DLP_PATH} --version`, { encoding: "utf8" }).trim();
    logger(`[yt-dlp] ✅ Downloaded & Ready → v${version}`);
    return true;
  } catch (err) {
    logger(`[yt-dlp] ❌ Download failed: ${err.message}`);
    logger("💡 Check: Railway build logs + Clear Cache & Redeploy");
    return false;
  }
}

let _ytdlp = null;
function getYtdlp() {
  if (!_ytdlp) _ytdlp = new YTDlpWrap(YT_DLP_PATH);
  return _ytdlp;
}

function getFfmpegPath() {
  return FFMPEG_PATH;
}

module.exports = {
  ensureYtdlp,
  getYtdlp,
  getFfmpegPath,
  FFMPEG_PATH,
  fluentFfmpeg,
  YT_DLP_PATH
};
