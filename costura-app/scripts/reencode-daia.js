import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDirUpper = path.join(__dirname, '..', 'public', 'Images');
const imagesDirLower = path.join(__dirname, '..', 'public', 'images');
const src = path.join(imagesDirUpper, 'daia.webp');

if (!fs.existsSync(src)) {
  console.error('No existe', src);
  process.exit(1);
}

(async () => {
  try {
    const meta = await sharp(src).metadata();
    console.log('Metadata:', meta);

    if (!fs.existsSync(imagesDirUpper)) fs.mkdirSync(imagesDirUpper, { recursive: true });
    if (!fs.existsSync(imagesDirLower)) fs.mkdirSync(imagesDirLower, { recursive: true });

    const out1 = path.join(imagesDirUpper, 'daia@1x.webp');
    const out1L = path.join(imagesDirLower, 'daia@1x.webp');
    await sharp(src)
      .webp({ quality: 95, effort: 6 })
      .toFile(out1);
    fs.copyFileSync(out1, out1L);
    console.log('Generado', out1);

    // generar 2x (sin agrandar si es muy pequeño)
    const want2x = meta.width ? Math.min(meta.width * 2, 1600) : 640;
    const out2 = path.join(imagesDirUpper, 'daia@2x.webp');
    const out2L = path.join(imagesDirLower, 'daia@2x.webp');
    await sharp(src)
      .resize({ width: want2x, withoutEnlargement: false })
      .webp({ quality: 95, effort: 6 })
      .toFile(out2);
    fs.copyFileSync(out2, out2L);
    console.log('Generado', out2);

    // opcional: sobrescribir daia.webp con versión de mayor calidad
    const outMain = path.join(imagesDirUpper, 'daia.webp');
    if (path.resolve(src) !== path.resolve(outMain)) {
      await sharp(src).webp({ quality: 95, effort: 6 }).toFile(outMain);
      fs.copyFileSync(outMain, path.join(imagesDirLower, 'daia.webp'));
      console.log('Re-encodificado', outMain);
    } else {
      console.log('Origen es el mismo que destino; omitiendo re-encode de daia.webp');
    }

  } catch (err) {
    console.error('Error re-encodificando:', err);
    process.exit(1);
  }
})();
