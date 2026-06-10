import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const imagesDirUpper = path.join(publicDir, 'Images');
const imagesDirLower = path.join(publicDir, 'images');

const candidates = ['daia.HEIC', 'IMG_7148.HEIC', 'daia.jpg', 'daia.png'];
let srcFile = null;
for (const c of candidates) {
  const p1 = path.join(imagesDirUpper, c);
  const p2 = path.join(imagesDirLower, c);
  if (fs.existsSync(p1)) { srcFile = p1; break; }
  if (fs.existsSync(p2)) { srcFile = p2; break; }
}

if (!srcFile) {
  console.error('No se encontró un archivo de origen para Daia en public/Images o public/images');
  process.exit(1);
}

if (!fs.existsSync(imagesDirUpper)) fs.mkdirSync(imagesDirUpper, { recursive: true });
if (!fs.existsSync(imagesDirLower)) fs.mkdirSync(imagesDirLower, { recursive: true });

const outputs = [
  { name: 'daia@1x.webp', width: 320, quality: 92 },
  { name: 'daia@2x.webp', width: 640, quality: 92 },
  { name: 'daia.webp', width: 640, quality: 92 },
];

async function convert() {
  for (const out of outputs) {
    const destUpper = path.join(imagesDirUpper, out.name);
    const destLower = path.join(imagesDirLower, out.name);
    try {
      let pipeline = sharp(srcFile);
      if (out.width) pipeline = pipeline.resize({ width: out.width, withoutEnlargement: true });
      await pipeline.webp({ quality: out.quality || 92, effort: 6 }).toFile(destUpper);
      // copy to lowercase folder to keep parity
      fs.copyFileSync(destUpper, destLower);
      console.log('Generado:', destUpper);
    } catch (err) {
      console.error('Error generando', out.name, err);
    }
  }
}

convert();
