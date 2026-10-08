import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PWA icon generator (WU3 — pwa-installability spec, "Manifest served and
 * linked" / iOS home-screen installability).
 *
 * Derives the app icons from the white-on-transparent brand logo
 * (public/Images/logo sin fondo blanco.png — the version used on dark
 * backgrounds) by compositing it centered on the Grow fuchsia canvas
 * (--color-primary, #E83E8C). Outputs standard PWA sizes plus the iOS
 * apple-touch-icon (opaque, no transparency).
 *
 * Usage: node scripts/generate-pwa-icons.js  (run from costura-app/)
 */
const FUCHSIA = { r: 232, g: 62, b: 140, alpha: 1 }; // #E83E8C — token --color-primary

const LOGO = path.join(__dirname, '..', 'public', 'Images', 'logo sin fondo blanco.png');
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// artworkHeight fraction of the canvas. Maskable uses the smaller size so the
// logo stays inside the platform safe zone (inner ~66% square / 80% circle).
const ICONS = [
  { file: 'icon-192.png', size: 192, artScale: 0.62 },
  { file: 'icon-512.png', size: 512, artScale: 0.62 },
  { file: 'maskable-512.png', size: 512, artScale: 0.56, purpose: 'maskable' },
  { file: 'apple-touch-icon.png', size: 180, artScale: 0.62 },
];

async function makeIcon({ file, size, artScale }) {
  const logo = sharp(LOGO);
  const meta = await logo.metadata();
  const artH = Math.round(size * artScale);
  const artW = Math.round((artH * meta.width) / meta.height);
  const overlay = await logo
    .resize(artW, artH, { fit: 'fill' })
    .png()
    .toBuffer();
  const left = Math.round((size - artW) / 2);
  const top = Math.round((size - artH) / 2);
  const dest = path.join(OUT_DIR, file);
  await sharp({
    create: { width: size, height: size, channels: 4, background: FUCHSIA },
  })
    .composite([{ input: overlay, left, top }])
    .png()
    .toFile(dest);
  return { dest, size, artW, artH, logoAspect: meta.width / meta.height };
}

async function main() {
  if (!fs.existsSync(LOGO)) {
    console.error('Brand logo not found:', LOGO);
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  for (const spec of ICONS) results.push(await makeIcon(spec));

  // Sanity check on the largest "any" tile: corner must be fuchsia and the
  // center must hold the white artwork (validates the composite).
  const { data, info } = await sharp(results[1].dest)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const corner = px(2, 2);
  const center = px(Math.floor(info.width / 2), Math.floor(info.height / 2));
  console.log('corner (expect ~fuchsia 232,62,140):', corner.join(','));
  console.log('center (expect white-ish art):', center.join(','));
  for (const r of results) console.log(`wrote ${r.dest} (${r.size}x${r.size}, art ${r.artW}x${r.artH})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
