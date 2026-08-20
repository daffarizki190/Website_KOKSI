import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Background Gradient: Teal to Turquoise to Warm Amber Accent -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="55%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>

    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <linearGradient id="innerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#042f2e" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Base App Background Squircle -->
  <rect width="512" height="512" rx="115" fill="url(#bgGrad)" />
  
  <!-- Subtle Top Highlight / Gloss -->
  <rect width="512" height="256" rx="115" fill="url(#innerGlow)" />

  <g filter="url(#shadow)" transform="translate(0, -10)">
    <!-- Shopping Bag Icon (Stylized Lucide Bag) -->
    <g transform="translate(146, 95) scale(9.16)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </g>

    <!-- SAZA Golden Pill Badge -->
    <g transform="translate(256, 360)">
      <rect x="-70" y="0" width="140" height="42" rx="21" fill="url(#badgeGrad)" filter="url(#shadow)"/>
      <text x="0" y="27" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="3">SAZA</text>
    </g>

    <!-- App Title Text -->
    <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="2">belanjain</text>
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

  // Generate Maskable 512x512 (with safe area padding for Android adaptive icons)
  const maskableSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#0d9488" />
    <g transform="translate(64, 64) scale(0.75)">
      ${svgIcon.replace(/<svg[^>]*>|<\/svg>/g, '')}
    </g>
  </svg>
  `;

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));

  // Generate apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Successfully generated all PWA icons with Belanjain SAZA branding!');
}

generate().catch(console.error);
