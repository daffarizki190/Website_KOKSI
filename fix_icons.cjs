const sharp = require('sharp');
const fs = require('fs');

async function fixIcons() {
  try {
    const svg = fs.readFileSync('public/favicon.svg');
    await sharp(svg).resize(192, 192).toFile('public/icon-192.png');
    await sharp(svg).resize(512, 512).toFile('public/icon-512.png');
    await sharp(svg).resize(512, 512).toFile('public/icon-maskable.png');
    await sharp(svg).resize(180, 180).toFile('public/apple-touch-icon.png');
    await sharp(svg).resize(400, 400).toFile('public/logo-belanjain-saza.png');
    console.log("Icons fixed!");
  } catch (e) {
    console.error(e);
  }
}
fixIcons();
