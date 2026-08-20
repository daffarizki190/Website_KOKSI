import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Standard 512x512 Icon with SAZA branded on the shopping bag
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Background Gradient: Rich Teal Brand Color -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="50%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>

    <!-- Text Gradient inside Bag: Deep Teal to Turquoise -->
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>

    <!-- Golden Amber Accent -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>

    <!-- Drop Shadow for Bag -->
    <filter id="bagShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#042f2e" flood-opacity="0.38"/>
    </filter>
  </defs>

  <!-- Background Squircle -->
  <rect x="20" y="20" width="472" height="472" rx="118" fill="url(#bgGrad)" />

  <g filter="url(#bagShadow)">
    <!-- Shopping Bag Handle -->
    <path d="M196 165 C196 90, 316 90, 316 165" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round"/>

    <!-- Shopping Bag Body (Crisp White Card with Rounded Corners) -->
    <rect x="120" y="160" width="272" height="240" rx="38" fill="#ffffff"/>

    <!-- Bag Inner Top Fold Line -->
    <path d="M120 205 L392 205" stroke="#f1f5f9" stroke-width="6"/>

    <!-- Golden Brand Dot on Top Fold -->
    <circle cx="355" cy="205" r="8" fill="url(#goldGrad)"/>

    <!-- Bold "SAZA" Typography inside the Shopping Bag -->
    <text x="256" y="305" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="62" fill="url(#textGrad)" text-anchor="middle" letter-spacing="5">SAZA</text>

    <!-- Amber "BELANJA" subtext inside Bag -->
    <text x="256" y="348" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="800" font-size="17" fill="#f59e0b" text-anchor="middle" letter-spacing="4">BELANJA</text>
  </g>
</svg>
`;

// Android Adaptive Maskable Icon (Full Bleed Background + Center Safe Area)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="50%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>

    <linearGradient id="textGradMask" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>

    <linearGradient id="goldGradMask" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>

    <filter id="maskShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#042f2e" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- 100% Full Bleed Background for Android Circles/Squircles -->
  <rect width="512" height="512" fill="url(#bgGradFull)" />

  <g filter="url(#maskShadow)" transform="translate(25.6, 25.6) scale(0.9)">
    <!-- Shopping Bag Handle -->
    <path d="M196 165 C196 90, 316 90, 316 165" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round"/>

    <!-- Shopping Bag Body -->
    <rect x="120" y="160" width="272" height="240" rx="38" fill="#ffffff"/>

    <!-- Bag Inner Top Fold Line -->
    <path d="M120 205 L392 205" stroke="#f1f5f9" stroke-width="6"/>
    <circle cx="355" cy="205" r="8" fill="url(#goldGradMask)"/>

    <!-- SAZA in Bag -->
    <text x="256" y="305" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="62" fill="url(#textGradMask)" text-anchor="middle" letter-spacing="5">SAZA</text>
    <text x="256" y="348" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="800" font-size="17" fill="#f59e0b" text-anchor="middle" letter-spacing="4">BELANJA</text>
  </g>
</svg>
`;

// iOS Apple Touch Icon (180x180 Full Bleed)
const appleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="50%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>

    <linearGradient id="textGradApple" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>

    <filter id="appleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#042f2e" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="512" height="512" fill="url(#appleGrad)" />

  <g filter="url(#appleShadow)">
    <path d="M196 165 C196 90, 316 90, 316 165" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round"/>
    <rect x="120" y="160" width="272" height="240" rx="38" fill="#ffffff"/>
    <path d="M120 205 L392 205" stroke="#f1f5f9" stroke-width="6"/>
    <circle cx="355" cy="205" r="8" fill="#f59e0b"/>
    <text x="256" y="305" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="62" fill="url(#textGradApple)" text-anchor="middle" letter-spacing="5">SAZA</text>
    <text x="256" y="348" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="800" font-size="17" fill="#f59e0b" text-anchor="middle" letter-spacing="4">BELANJA</text>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Generate 512x512 and 192x192
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 2. Generate Android maskable icon
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));

  // 3. Generate Apple touch icon
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Successfully generated Belanjain SAZA shopping bag icons with SAZA text in center!');
}

generate().catch(console.error);
