import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crcVal, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

// Draw Premium StreamVibe App Icon
function drawAppIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const cornerRadius = isMaskable ? 0 : w * 0.22;
  
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  if (!isMaskable) {
    const margin = w * 0.04;
    const rx = Math.max(0, dx - (cx - margin - cornerRadius));
    const ry = Math.max(0, dy - (cy - margin - cornerRadius));
    if (rx * rx + ry * ry > cornerRadius * cornerRadius && dx > cx - margin - cornerRadius && dy > cy - margin - cornerRadius) {
      return [0, 0, 0, 0];
    }
    if (dx > cx - margin || dy > cy - margin) {
      return [0, 0, 0, 0];
    }
  }

  // Base background: Deep sleek obsidian dark theme #080b12 -> #030407
  const t = y / h;
  let r = Math.round(9 * (1 - t) + 4 * t);
  let g = Math.round(12 * (1 - t) + 6 * t);
  let b = Math.round(20 * (1 - t) + 10 * t);

  // Outer ambient neon ring/squircle in middle
  const badgeSize = isMaskable ? w * 0.32 : w * 0.38;
  const distCenter = Math.hypot(x - cx, y - cy);

  // Crimson/Rose radial glow in upper-middle
  const distGlow = Math.hypot(x - cx, y - (cy - h * 0.08));
  const glowRadius = w * 0.44;
  if (distGlow < glowRadius) {
    const factor = Math.cos((distGlow / glowRadius) * (Math.PI / 2));
    r = Math.min(255, Math.round(r + 235 * factor));
    g = Math.min(255, Math.round(g + 28 * factor));
    b = Math.min(255, Math.round(b + 70 * factor));
  }

  // Draw vibrant central shield / rounded badge with gradient
  const badgeRadius = badgeSize;
  const inBadge = Math.abs(x - cx) < badgeSize && Math.abs(y - cy) < badgeSize;
  if (inBadge) {
    const bdx = Math.abs(x - cx);
    const bdy = Math.abs(y - cy);
    const bCorner = badgeSize * 0.4;
    const brx = Math.max(0, bdx - (badgeSize - bCorner));
    const bry = Math.max(0, bdy - (badgeSize - bCorner));
    if (brx * brx + bry * bry <= bCorner * bCorner || bdx <= badgeSize - bCorner || bdy <= badgeSize - bCorner) {
      // Badge interior: rich ruby rose gradient
      const bt = (y - (cy - badgeSize)) / (badgeSize * 2);
      r = Math.round(244 * (1 - bt) + 159 * bt);
      g = Math.round(63 * (1 - bt) + 18 * bt);
      b = Math.round(94 * (1 - bt) + 57 * bt);
    }
  }

  // Draw bold crisp white Play Triangle
  const triScale = isMaskable ? 0.16 : 0.19;
  const triLeft = cx - w * (triScale * 0.65);
  const triRight = cx + w * (triScale * 0.85);

  if (x >= triLeft && x <= triRight) {
    const progress = (x - triLeft) / (triRight - triLeft);
    const halfH = (h * triScale) * (1 - progress);
    if (Math.abs(y - cy) <= halfH) {
      return [255, 255, 255, 255];
    }
  }

  return [r, g, b, 255];
}

// Generate a clean preview screenshot for PWA manifest (Mobile & Desktop)
function drawScreenshot(x, y, w, h, isMobile = true) {
  // Dark app background #0a0d14
  const t = y / h;
  let r = Math.round(11 * (1 - t) + 6 * t);
  let g = Math.round(14 * (1 - t) + 9 * t);
  let b = Math.round(22 * (1 - t) + 14 * t);

  // Top header bar
  const headerHeight = Math.round(h * 0.08);
  if (y < headerHeight) {
    r = 15; g = 20; b = 32;
    // Brand red dot
    if (Math.hypot(x - w * 0.1, y - headerHeight / 2) < headerHeight * 0.25) {
      return [244, 63, 94, 255];
    }
  }

  // Simulated Video Card area
  const cardTop = headerHeight + Math.round(h * 0.04);
  const cardH = Math.round(h * (isMobile ? 0.38 : 0.55));
  const cardLeft = Math.round(w * 0.06);
  const cardW = Math.round(w * 0.88);

  if (x >= cardLeft && x <= cardLeft + cardW && y >= cardTop && y <= cardTop + cardH) {
    // Inside video player
    const vy = (y - cardTop) / cardH;
    r = Math.round(22 * (1 - vy) + 8 * vy);
    g = Math.round(28 * (1 - vy) + 12 * vy);
    b = Math.round(45 * (1 - vy) + 20 * vy);

    // Center play circle
    const vcx = cardLeft + cardW / 2;
    const vcy = cardTop + cardH / 2;
    const playR = Math.min(cardW, cardH) * 0.15;
    const pdist = Math.hypot(x - vcx, y - vcy);
    if (pdist < playR) {
      return [244, 63, 94, 230];
    }
    // Play triangle
    if (Math.abs(x - vcx) < playR * 0.4 && Math.abs(y - vcy) < playR * 0.4) {
      const pprog = (x - (vcx - playR * 0.3)) / (playR * 0.6);
      if (pprog >= 0 && pprog <= 1 && Math.abs(y - vcy) <= (playR * 0.4) * (1 - pprog)) {
        return [255, 255, 255, 255];
      }
    }
  }

  return [r, g, b, 255];
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating crisp PWA icons and screenshot assets...');

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

// Generate PWA screenshots (Mobile 390x844 & Desktop 800x450 for install sheet)
fs.writeFileSync(path.join(publicDir, 'screenshot-mobile.png'), createPng(390, 844, (x, y, w, h) => drawScreenshot(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'screenshot-desktop.png'), createPng(800, 450, (x, y, w, h) => drawScreenshot(x, y, w, h, false)));

// High-fidelity SVG Icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0e1320" />
      <stop offset="50%" stop-color="#080b12" />
      <stop offset="100%" stop-color="#030407" />
    </linearGradient>
    <linearGradient id="shieldGrad" x1="120" y1="100" x2="392" y2="412" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="50%" stop-color="#e11d48" />
      <stop offset="100%" stop-color="#9f1239" />
    </linearGradient>
    <radialGradient id="ambientGlow" cx="256" cy="220" r="220" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.45" />
      <stop offset="60%" stop-color="#be123c" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="160" y="140" width="220" height="240" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>
  <!-- Background with subtle border -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />
  <rect width="508" height="508" x="2" y="2" rx="118" stroke="#334155" stroke-width="2" stroke-opacity="0.4" />
  <!-- Radial Neon Glow -->
  <circle cx="256" cy="230" r="210" fill="url(#ambientGlow)" />
  <!-- Vibrant Center Badge / Shield -->
  <rect x="136" y="136" width="240" height="240" rx="64" fill="url(#shieldGrad)" />
  <!-- Play Icon with Shadow -->
  <path d="M224 196 L332 256 L224 316 Z" fill="#ffffff" filter="url(#shadow)" stroke="#ffffff" stroke-width="4" stroke-linejoin="round" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg, 'utf-8');

console.log('Successfully generated complete PWA icons & screenshots in /public!');
