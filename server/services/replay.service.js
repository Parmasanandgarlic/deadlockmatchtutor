const axios = require('axios');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Build the Valve CDN URL for a replay file.
 * Typical format: https://replay{cluster}.valve.net/1422450/{match_id}_{salt}.dem.bz2
 * The exact format may vary — this constructs the most common pattern.
 */
function buildCdnUrl(matchId, metadata) {
  const clusterId = metadata.cluster_id ?? 1;
  const salt = metadata.salt ?? metadata.replay_salt ?? '';
  return `https://replay${clusterId}.valve.net/1422450/${matchId}_${salt}.dem.bz2`;
}

/**
 * Download the compressed .dem.bz2 replay from Valve CDN.
 * @param {string} matchId
 * @param {Object} metadata  Metadata from deadlock-api (must contain cluster_id & salt)
 * @returns {Promise<string>} Absolute path to the downloaded .dem.bz2 file
 */
async function downloadReplay(matchId, metadata) {
  const url = buildCdnUrl(matchId, metadata);
  const destPath = path.join(config.tempDir, `${matchId}.dem.bz2`);

  logger.info(`Downloading replay: ${url}`);

  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 120000,
    });

    const writer = fs.createWriteStream(destPath);
    await pipeline(response.data, writer);

    const stats = fs.statSync(destPath);
    logger.info(`Replay downloaded: ${destPath} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

    return destPath;
  } catch (err) {
    cleanup(destPath);
    if (err.response?.status === 404) {
      throw new Error(
        'Replay not found on Valve CDN. It may have expired (~7 days after the match).'
      );
    }
    logger.error(`Replay download failed: ${err.message}`);
    throw new Error('Failed to download replay from Valve CDN.');
  }
}

/**
 * Decompress a .dem.bz2 file to a raw .dem file.
 * Uses Node's built-in brotli/zlib. BZ2 requires a third-party or shell decompression.
 * For MVP we shell out to `bzip2` or use the `seek-bzip` npm package.
 * This implementation uses a streaming approach with `unbzip2-stream`.
 *
 * NOTE: In production, swap to a native bzip2 binding for better performance.
 *
 * @param {string} bz2Path  Path to the .dem.bz2 file
 * @returns {Promise<string>} Path to the decompressed .dem file
 */
async function decompressReplay(bz2Path) {
  const demPath = bz2Path.replace(/\.bz2$/, '');
  logger.info(`Decompressing replay: ${bz2Path}`);

  try {
    // Dynamic import for unbzip2-stream (CommonJS compatible)
    const unbzip2 = require('unbzip2-stream');
    const readStream = fs.createReadStream(bz2Path);
    const writeStream = fs.createWriteStream(demPath);

    await pipeline(readStream, unbzip2(), writeStream);

    const stats = fs.statSync(demPath);
    logger.info(`Decompressed: ${demPath} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

    // Remove the compressed file immediately
    cleanup(bz2Path);

    return demPath;
  } catch (err) {
    cleanup(demPath);
    cleanup(bz2Path);
    logger.error(`Decompression failed: ${err.message}`);
    throw new Error('Failed to decompress replay file.');
  }
}

/**
 * Delete a file if it exists (best-effort cleanup).
 */
function cleanup(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`Cleaned up: ${filePath}`);
    }
  } catch (err) {
    logger.warn(`Cleanup failed for ${filePath}: ${err.message}`);
  }
}

module.exports = {
  buildCdnUrl,
  downloadReplay,
  decompressReplay,
  cleanup,
};
