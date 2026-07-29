import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = new URL("../", import.meta.url);
const faviconPath = fileURLToPath(new URL("public/favicon.svg", projectRoot));
const imageDirectory = fileURLToPath(new URL("public/images/", projectRoot));
const socialImagePath = fileURLToPath(new URL("public/images/tooonran-og.png", projectRoot));
const appleTouchIconPath = fileURLToPath(new URL("public/apple-touch-icon.png", projectRoot));

await mkdir(imageDirectory, { recursive: true });

const favicon = await readFile(faviconPath);
const brandMark = await sharp(favicon, { density: 384 }).resize(252, 252).png().toBuffer();
const cardArtwork = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="signal" cx="50%" cy="50%" r="70%">
        <stop offset="0" stop-color="#ff695b" stop-opacity="0.2" />
        <stop offset="0.55" stop-color="#090b10" stop-opacity="0.04" />
        <stop offset="1" stop-color="#090b10" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f4f5f2" stop-opacity="0.08" />
        <stop offset="1" stop-color="#f4f5f2" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="#090b10" />
    <rect width="1200" height="630" fill="url(#signal)" />
    <rect x="72" y="72" width="1056" height="486" rx="28" fill="none" stroke="url(#edge)" />
    <path d="M72 144H1128M72 486H1128M144 72V558M1056 72V558" stroke="#f4f5f2" stroke-opacity="0.055" />
    <circle cx="1080" cy="120" r="5" fill="#ff695b" />
    <circle cx="1080" cy="120" r="18" fill="none" stroke="#ff695b" stroke-opacity="0.22" />
    <circle cx="1080" cy="120" r="34" fill="none" stroke="#ff695b" stroke-opacity="0.1" />
    <path d="M160 315H410M790 315H1040" stroke="#f4f5f2" stroke-opacity="0.12" />
    <path d="M190 296V334M1010 296V334" stroke="#ff695b" stroke-opacity="0.7" />
  </svg>
`);

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: "#090b10",
  },
})
  .composite([
    { input: cardArtwork, left: 0, top: 0 },
    { input: brandMark, left: 474, top: 189 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(socialImagePath);

await sharp(favicon, { density: 384 })
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(appleTouchIconPath);

console.log("Generated SEO images from public/favicon.svg.");
