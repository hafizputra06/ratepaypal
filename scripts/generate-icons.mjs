// Generate PWA icons (pure Node, no deps). Design: navy->blue rounded tile
// + two overlapping circles (white & sky) = exchange mark.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const NAVY = [0x00, 0x30, 0x87];
const BLUE = [0x00, 0x70, 0xba];
const SKY = [0x00, 0x9c, 0xde];
const WHITE = [0xff, 0xff, 0xff];

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function toPNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

function inRoundedRect(x, y, S, r) {
  if (x < 0 || y < 0 || x >= S || y >= S) return false;
  const cx = Math.min(Math.max(x, r), S - r);
  const cy = Math.min(Math.max(y, r), S - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r || (x >= r && x < S - r) || (y >= r && y < S - r);
}

// Render master at SSx supersampling, then box-downsample to `size`.
function render({ size, fullBleed, markScale }) {
  const SS = 2;
  const W = size * SS;
  const R = fullBleed ? 0 : 112 * SS * (size / 512);
  const buf = Buffer.alloc(W * W * 4);
  const ms = markScale * (size / 512);
  const cAx = 196 * ms + (size * SS - 512 * ms) / 2;
  const cBx = 316 * ms + (size * SS - 512 * ms) / 2;
  const cY = 256 * ms + (size * SS - 512 * ms) / 2;
  const cr = 122 * ms;
  const tileR = fullBleed ? 0 : R;

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let r = 0, g = 0, b = 0, a = 0;
      const inTile = fullBleed ? true : inRoundedRect(px / SS, py / SS, size, tileR / SS);
      if (inTile) {
        const t = py / W;
        const bg = mix(NAVY, BLUE, t);
        r = bg[0]; g = bg[1]; b = bg[2]; a = 255;
        const dA = (px - cAx) ** 2 + (py - cY) ** 2 <= cr * cr;
        const dB = (px - cBx) ** 2 + (py - cY) ** 2 <= cr * cr;
        if (dA) { r = 255; g = 255; b = 255; }
        if (dB) {
          const sa = 0.92;
          r = SKY[0] * sa + r * (1 - sa);
          g = SKY[1] * sa + g * (1 - sa);
          b = SKY[2] * sa + b * (1 - sa);
        }
      }
      const o = (y * W + x) * 4;
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = a;
    }
  }
  // box downsample
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const o = ((y * SS + dy) * W + (x * SS + dx)) * 4;
          r += buf[o]; g += buf[o + 1]; b += buf[o + 2]; a += buf[o + 3];
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

const jobs = [
  ["icon-192.png", { size: 192, fullBleed: false, markScale: 1 }],
  ["icon-512.png", { size: 512, fullBleed: false, markScale: 1 }],
  ["maskable-512.png", { size: 512, fullBleed: true, markScale: 0.7 }],
  ["apple-touch-icon.png", { size: 180, fullBleed: true, markScale: 0.86 }],
];

for (const [name, opts] of jobs) {
  writeFileSync(join(outDir, "..", name === "apple-touch-icon.png" ? name : join("icons", name)), toPNG(opts.size, opts.size, render(opts)));
  console.log("wrote", name);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#003087"/>
      <stop offset="1" stop-color="#0070BA"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <circle cx="196" cy="256" r="122" fill="#ffffff"/>
  <circle cx="316" cy="256" r="122" fill="#009CDE" fill-opacity="0.92"/>
</svg>
`;
writeFileSync(join(outDir, "icon.svg"), svg);
console.log("wrote icon.svg");
