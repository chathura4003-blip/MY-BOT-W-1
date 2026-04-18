"use strict";

const fs = require("fs");
const { execSync } = require("child_process");
const YTDlpWrap = require("yt-dlp-wrap").default;
const ffmpegStatic = require("ffmpeg-static");
const fluentFfmpeg = require("fluent-ffmpeg");
const { logger } = require("../logger");

// Railway (Linux) + Local development support
const YT_DLP_PATH = "/usr/local/bin/yt-dlp";
let FFMPEG_PATH = null;

(function detectFfmpeg() {
  const candidates = [
    process.env.FFMPEG_PATH,           // Railway env variable
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    ffmpegStatic,                      // npm package fallback
  ].filter(Boolean); // null/undefined remove

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
    logger("[ffmpeg] ⚠️ WARNING: ffmpeg not found - video compression may fail");
  }
})();

async function ensureYtdlp() {
  if (fs.existsSync(YT_DLP_PATH)) {
    try {
      const version = execSync(`${YT_DLP_PATH} --version`, { encoding: "utf8" }).trim();
      logger(`[yt-dlp] ✅ Ready → v${version}`);
      return true;
    } catch (err) {
      logger(`[yt-dlp] ⚠️ Binary exists but error: ${err.message}`);
    }
  }

  logger("[yt-dlp] ❌ Binary not found. Check nixpacks.toml & redeploy!");
  return false;
}

let _ytdlp = null;
function getYtdlp() {
  if (!_ytdlp) {
    _ytdlp = new YTDlpWrap(YT_DLP_PATH);
  }
  return _ytdlp;
}

// Extra helper (optional but useful)
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
