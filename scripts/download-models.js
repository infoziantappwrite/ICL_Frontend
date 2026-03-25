/**
 * download-models.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Downloads face-api.js AI model files into /public/models/
 *
 * Run ONCE before starting the dev server:
 *   node scripts/download-models.js
 *
 * These files are ~540 KB total and must be present for camera proctoring
 * to work. Without them, startCamera() will fail with status 'model_error'.
 *
 * Models used:
 *  • tiny_face_detector     — fast face detection (~190 KB)
 *  • face_landmark_68_tiny  — 68-point facial landmarks (~350 KB)
 *                             (used for eye tracking, head pose, EAR)
 */

import https from 'https';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

const BASE_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

const FILES = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  // Face Landmark 68 Tiny
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
];

const downloadFile = (url, dest) => new Promise((resolve, reject) => {
  if (fs.existsSync(dest)) {
    console.log(`  ✓ Already exists: ${path.basename(dest)}`);
    return resolve();
  }

  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      file.close();
      fs.unlink(dest, () => {});
      return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      const size = fs.statSync(dest).size;
      console.log(`  ✓ Downloaded: ${path.basename(dest)} (${(size / 1024).toFixed(1)} KB)`);
      resolve();
    });
  }).on('error', (err) => {
    file.close();
    fs.unlink(dest, () => {});
    reject(err);
  });
});

async function main() {
  console.log('\n📦 Downloading face-api.js models to /public/models/\n');

  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`  Created directory: ${MODELS_DIR}\n`);
  }

  let failed = 0;
  for (const file of FILES) {
    const url  = `${BASE_URL}/${file}`;
    const dest = path.join(MODELS_DIR, file);
    try {
      await downloadFile(url, dest);
    } catch (err) {
      console.error(`  ✗ Failed: ${file} — ${err.message}`);
      failed++;
    }
  }

  if (failed === 0) {
    console.log('\n✅ All models downloaded successfully!');
    console.log('   Now run: npm run dev\n');
  } else {
    console.error(`\n❌ ${failed} file(s) failed to download.`);
    console.error('   Check your internet connection and try again.\n');
    process.exit(1);
  }
}

main();