// Generates the PWA app icons as real PNGs (no external image libs).
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const COLORS = {
  green: [95, 122, 63], // #5f7a3f accent
  cream: [253, 252, 249], // #fdfcf9 surface
  ink: [43, 43, 43], // #2b2b2b
  liquid: [143, 166, 110], // muted green liquid
};

// ---- minimal PNG encoder (RGBA, 8-bit) ----
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = compression/filter/interlace = 0

  // add filter byte (0) per scanline
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- drawing ----
function makeIcon(size, { maskable }) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  };

  const radius = maskable ? 0 : Math.round(size * 0.22);
  const inCorner = (x, y) => {
    // round only the outer corners for the non-maskable tile
    const r = radius;
    const cx = x < r ? r : x > size - r ? size - r : x;
    const cy = y < r ? r : y > size - r ? size - r : y;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };

  // background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (radius === 0 || inCorner(x, y)) {
        set(x, y, COLORS.green);
      }
    }
  }

  // jar geometry (smaller for maskable safe zone)
  const scale = maskable ? 0.56 : 0.62;
  const jarW = Math.round(size * scale);
  const jarH = Math.round(jarW * 1.12);
  const jarX = Math.round((size - jarW) / 2);
  const jarY = Math.round((size - jarH) / 2 + size * 0.04);
  const jarR = Math.round(jarW * 0.18);

  const fillRoundRect = (rx, ry, rw, rh, rr, color) => {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const cx = x < rx + rr ? rx + rr : x > rx + rw - rr ? rx + rw - rr : x;
        const cy = y < ry + rr ? ry + rr : y > ry + rh - rr ? ry + rh - rr : y;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rr * rr) set(x, y, color);
      }
    }
  };

  // jar body (cream)
  fillRoundRect(jarX, jarY, jarW, jarH, jarR, COLORS.cream);
  // liquid band in the lower portion
  const liqTop = jarY + Math.round(jarH * 0.42);
  fillRoundRect(
    jarX,
    liqTop,
    jarW,
    jarY + jarH - liqTop,
    jarR,
    COLORS.liquid,
  );
  // re-round the bottom by overpainting the body corners already handled; lid on top (ink)
  const lidH = Math.round(jarH * 0.16);
  const lidW = Math.round(jarW * 0.62);
  const lidX = Math.round((size - lidW) / 2);
  const lidY = jarY - Math.round(lidH * 0.55);
  fillRoundRect(lidX, lidY, lidW, lidH, Math.round(lidH * 0.4), COLORS.ink);

  // a couple of bubbles in the liquid
  const bubble = (bx, by, br) => {
    for (let y = by - br; y <= by + br; y++) {
      for (let x = bx - br; x <= bx + br; x++) {
        const dx = x - bx;
        const dy = y - by;
        if (dx * dx + dy * dy <= br * br) set(x, y, COLORS.cream);
      }
    }
  };
  bubble(jarX + Math.round(jarW * 0.36), liqTop + Math.round(jarH * 0.2), Math.round(jarW * 0.05));
  bubble(jarX + Math.round(jarW * 0.6), liqTop + Math.round(jarH * 0.33), Math.round(jarW * 0.035));

  return encodePng(size, size, buf);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "icon-192.png"), makeIcon(192, { maskable: false }));
writeFileSync(join(OUT_DIR, "icon-512.png"), makeIcon(512, { maskable: false }));
writeFileSync(join(OUT_DIR, "maskable-512.png"), makeIcon(512, { maskable: true }));
writeFileSync(join(OUT_DIR, "apple-touch-icon.png"), makeIcon(180, { maskable: false }));
console.log("Icons written to", OUT_DIR);
