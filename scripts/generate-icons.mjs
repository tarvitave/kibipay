// Generates placeholder extension icons using sharp
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../apps/extension/public/icons');
mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const radius = Math.floor(size * 0.2);
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#1a4fff"/>
  <text
    x="${size / 2}"
    y="${size * 0.72}"
    font-family="Arial, sans-serif"
    font-size="${Math.floor(size * 0.58)}"
    font-weight="700"
    fill="white"
    text-anchor="middle"
  >K</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(iconsDir, `icon${size}.png`));
  console.log(`✓ icon${size}.png`);
}

console.log('\nDone — apps/extension/public/icons/');
