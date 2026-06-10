import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'public', 'Images');
const destDir = path.join(__dirname, '..', 'public', 'images');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const tasks = [
  { src: 'ultima portada web.png', dest: 'hero.webp', options: { quality: 85 } },
  { src: 'logo-nuevo-grow.png', dest: 'logo-grow.webp', options: { quality: 90 } },
  { src: 'IMG_7148.HEIC', dest: 'daia.webp', options: { quality: 85 } },
];

async function convert() {
  for (const t of tasks) {
    const srcPath = path.join(srcDir, t.src);
    const destPath = path.join(destDir, t.dest);
    if (!fs.existsSync(srcPath)) {
      console.warn('No existe:', srcPath);
      continue;
    }
    try {
      await sharp(srcPath)
        .webp({ quality: t.options.quality || 80 })
        .toFile(destPath);
      console.log('Converted', srcPath, '->', destPath);
    } catch (err) {
      console.error('Error converting', srcPath, err);
    }
  }
}

convert();
