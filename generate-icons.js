import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Base App Icon Card -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
  
  <g filter="url(#shadow)">
    <!-- Shopping Bag Handle -->
    <path d="M192 180 C192 110, 320 110, 320 180" fill="none" stroke="#14b8a6" stroke-width="26" stroke-linecap="round"/>

    <!-- Shopping Bag Body -->
    <rect x="112" y="180" width="288" height="230" rx="36" fill="url(#bagGrad)"/>
    
    <!-- Inner Fold Line -->
    <path d="M112 225 L400 225" stroke="#0f766e" stroke-width="10" opacity="0.6"/>

    <!-- KOKSI Branding Text -->
    <text x="256" y="325" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle" letter-spacing="3">KOKSI</text>
    <text x="256" y="365" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="20" fill="#99f6e4" text-anchor="middle" letter-spacing="4">BELANJA</text>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(svgIcon);

  // Generate 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Generate 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // Generate Maskable 512x512 (with safe area padding)
  const maskableSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#0f172a" />
    <g transform="translate(51, 51) scale(0.8)">
      ${svgIcon.replace(/<svg[^>]*>|<\/svg>/g, '')}
    </g>
  </svg>
  `;

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));

  // Generate favicon.ico / apple-touch-icon.png
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Successfully generated all PWA icons (PNG)!');
}

generate().catch(console.error);
