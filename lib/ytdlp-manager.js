"use strict";

const fs = require("fs");
const { execSync } = require("child_process");
const YTDlpWrap = require("yt-dlp-wrap").default;
const ffmpegStatic = require("ffmpeg-static");
const fluentFfmpeg = require("fluent-ffmpeg");
const { logger } = require("../logger");

const YT_DLP_PATH = "/usr/local/bin/yt-dlp";   // ← Best path for Railway
let FFMPEG_PATH = null;

(function detectFfmpeg() {
  const candidates = [
    process.env.FFMPEG_PATH,
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    ffmpegStatic,
  ].filter(Boolean);

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      FFMPEG_PATH = p;
      fluentFfmpeg.setFfmpegPath(p);
      logger(`[ffmpeg] ✅ Using: ${p}`);
      return;
    }
  }
  logger("[ffmpeg] ⚠️ ffmpeg not found - video processing limited");
})();

async function ensureYtdlp() {
  // Already installed da?
  if (fs.existsSync(YT_DLP_PATH)) {
    try {
      const version = execSync(`${YT_DLP_PATH} --version`, { encoding: "utf8" }).trim();
      logger(`[yt-dlp] ✅ Ready → ${version}`);
      return true;
    } catch (e) {}
  }

  // Download at runtime (safe fallback)
  logger("[yt-dlp] ⚠️ Binary missing → Downloading to /usr/local/bin ...");
  try {
    execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${YT_DLP_PATH}`, { stdio: "ignore" });
    execSync(`chmod a+rx ${YT_DLP_PATH}`, { stdio: "ignore" });

    const version = execSync(`${YT_DLP_PATH} --version`, { encoding: "utf8" }).trim();
    logger(`[yt-dlp] ✅ Successfully downloaded → ${version}`);
    return true;
  } catch (err) {
    logger(`[yt-dlp] ❌ Download failed: ${err.message}`);
    logger("💡 Try: Clear Cache & Redeploy on Railway");
    return false;
  }
}

let _ytdlp = null;
function getYtdlp() {
  if (!_ytdlp) _ytdlp = new YTDlpWrap(YT_DLP_PATH);
  return _ytdlp;
}

module.exports = {
  ensureYtdlp,
  getYtdlp,
  FFMPEG_PATH,
  fluentFfmpeg,
  YT_DLP_PATH
};
