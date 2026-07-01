const fs = require('fs');

function getSize(path) {
  const buf = fs.readFileSync(path);
  // JPEG
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xFF) { i++; continue; }
      const marker = buf[i+1];
      if (marker === 0xD9 || marker === 0xDA) break;
      const len = buf.readUInt16BE(i+2);
      if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) || (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
        const height = buf.readUInt16BE(i+5);
        const width = buf.readUInt16BE(i+7);
        return { width, height, type: 'jpeg' };
      } else {
        i += 2 + len;
      }
    }
    return { type: 'jpeg', width: null, height: null };
  }

  // PNG
  if (buf.slice(0,8).equals(Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]))) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height, type: 'png' };
  }

  // WebP (basic handling)
  if (buf.slice(0,4).toString() === 'RIFF' && buf.slice(8,12).toString() === 'WEBP') {
    return { width: null, height: null, type: 'webp' };
  }

  return { width: null, height: null, type: 'unknown' };
}

const base = __dirname + '/..';
const files = [
  base + '/public/Images/IMG_7148.jpg',
  base + '/public/Images/IMG_8373.jpg',
  base + '/public/Images/logo-nuevo-grow.png'
];

for (const f of files) {
  try {
    const stat = fs.statSync(f);
    const size = getSize(f);
    console.log(`${f.split(/[\\\\\/]/).pop()} ${stat.size} bytes - ${size.type} - ${size.width || '?'}x${size.height || '?'}`);
  } catch (e) {
    console.error('ERR', f, e.message);
  }
}
