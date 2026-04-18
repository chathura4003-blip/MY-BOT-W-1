"use strict";

const fs = require("fs");
const { execSync } = require("child_process");
const YTDlpWrap = require("yt-dlp-wrap").default;
const ffmpegStatic = require("ffmpeg-static");
const fluentFfmpeg = require("fluent-ffmpeg");
const { logger } = require("../logger");

const YT_DLP_PATH = "/usr/local/bin/yt-dlp";
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
  logger("[ffmpeg] ⚠️ ffmpeg not found");
})();

async function ensureYtdlp() {
  if (fs.existsSync(YT_DLP_PATH)) {
    try {
      const version = execSync(`${YT_DLP_PATH} --version`, { encoding: "utf8" }).trim();
      logger(`[yt-dlp] ✅ Ready → ${version}`);
      return true;
    } catch (e) {
      logger("[yt-dlp] ⚠️ Existing binary corrupted, re-downloading...");
      fs.unlinkSync(YT_DLP_PATH); // corrupt file delete karanawa
    }
  }

  logger("[yt-dlp] ⚠️ Binary missing → Downloading with proper flags...");
  try {
    // Improved curl command ( -L + -f + --silent + output control )
    execSync(`curl -L -f --silent -o ${YT_DLP_PATH} https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp`, 
      { stdio: "ignore", timeout: 60000 });

    execSync(`chmod a+rx ${YT_DLP_PATH}`, { stdio: "ignore" });

    // Verify
    const version = execSync(`${YT_DLP_PATH} --version`, { encoding: "utf8" }).trim();
    logger(`[yt-dlp] ✅ Successfully installed → ${version}`);
    return true;
  } catch (err) {
    logger(`[yt-dlp] ❌ Download failed: ${err.message}`);
    logger("💡 Solution: Use nixpacks.toml for build-time install (more reliable)");
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
