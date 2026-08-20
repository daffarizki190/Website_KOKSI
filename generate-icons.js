import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Full-Page Shopping Bag App Icon (No extra background tile, the icon IS the bag)
// belanjain text is placed on top of SAZA pill badge
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Rich Teal Gradient for the full Bag Body -->
    <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="45%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>

    <!-- Golden Amber Gradient for the SAZA Badge -->
    <linearGradient id="goldBadge" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>

    <!-- Soft Depth Shadow -->
    <filter id="depthShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#022c22" flood-opacity="0.38"/>
    </filter>

    <!-- Inner Top Fold Shadow -->
    <linearGradient id="topFold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#042f2e" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#042f2e" stop-opacity="0"/>
    </linearGradient>

    <!-- Top Highlight Gloss -->
    <linearGradient id="topGloss" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Full Frame Bag Body (Fills the entire icon squircle) -->
  <rect x="20" y="20" width="472" height="472" rx="116" fill="url(#bagGrad)"/>
  
  <!-- Subtle Top Gloss Curve -->
  <rect x="20" y="20" width="472" height="236" rx="116" fill="url(#topGloss)"/>

  <!-- Shopping Bag Handle Arch -->
  <g filter="url(#depthShadow)">
    <path d="M192 115 C192 48, 320 48, 320 115" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round"/>
  </g>

  <!-- Top Fold Crease Line -->
  <line x1="20" y1="135" x2="492" y2="135" stroke="#042f2e" stroke-width="4" opacity="0.35"/>
  <rect x="20" y="135" width="472" height="28" fill="url(#topFold)"/>

  <!-- Center Branding: 1. "belanjain" Text (Above SAZA) -->
  <g filter="url(#depthShadow)" transform="translate(256, 275)">
    <text x="0" y="0" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="66" text-anchor="middle" letter-spacing="-1">
      <tspan fill="#ffffff">belanja</tspan><tspan fill="#f59e0b" font-style="italic">in</tspan>
    </text>
  </g>

  <!-- Center Branding: 2. "SAZA" Pill Badge (Below belanjain) -->
  <g filter="url(#depthShadow)" transform="translate(256, 360)">
    <rect x="-85" y="-28" width="170" height="56" rx="28" fill="url(#goldBadge)"/>
    <text x="0" y="10" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="4">SAZA</text>
  </g>
</svg>
`;

// Android Adaptive Maskable Icon (Full Bleed Background + Center Safe Area)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bagGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="45%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>

    <linearGradient id="goldBadgeMask" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>

    <filter id="depthShadowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#022c22" flood-opacity="0.38"/>
    </filter>

    <linearGradient id="topFoldMask" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#042f2e" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#042f2e" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- 100% Full Bleed Background for Android Circles/Squircles -->
  <rect width="512" height="512" fill="url(#bagGradFull)" />

  <!-- Bag Content Fitted in Safe Circle Zone -->
  <g transform="translate(0, 10)">
    <!-- Shopping Bag Handle Arch -->
    <g filter="url(#depthShadowMask)">
      <path d="M196 125 C196 65, 316 65, 316 125" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round"/>
    </g>

    <!-- Top Fold Crease Line -->
    <line x1="0" y1="145" x2="512" y2="145" stroke="#042f2e" stroke-width="4" opacity="0.35"/>
    <rect x="0" y="145" width="512" height="28" fill="url(#topFoldMask)"/>

    <!-- "belanjain" Text -->
    <g filter="url(#depthShadowMask)" transform="translate(256, 275)">
      <text x="0" y="0" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="66" text-anchor="middle" letter-spacing="-1">
        <tspan fill="#ffffff">belanja</tspan><tspan fill="#f59e0b" font-style="italic">in</tspan>
      </text>
    </g>

    <!-- "SAZA" Pill Badge -->
    <g filter="url(#depthShadowMask)" transform="translate(256, 355)">
      <rect x="-85" y="-28" width="170" height="56" rx="28" fill="url(#goldBadgeMask)"/>
      <text x="0" y="10" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="4">SAZA</text>
    </g>
  </g>
</svg>
`;

// iOS Apple Touch Icon (180x180 Full Bleed)
const appleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="45%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>
    <linearGradient id="appleGold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <filter id="appleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#022c22" flood-opacity="0.38"/>
    </filter>
  </defs>

  <rect width="512" height="512" fill="url(#appleGrad)" />
  <g filter="url(#appleShadow)">
    <path d="M192 115 C192 48, 320 48, 320 115" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round"/>
  </g>
  <line x1="0" y1="135" x2="512" y2="135" stroke="#042f2e" stroke-width="4" opacity="0.35"/>
  <g filter="url(#appleShadow)" transform="translate(256, 275)">
    <text x="0" y="0" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="66" text-anchor="middle" letter-spacing="-1">
      <tspan fill="#ffffff">belanja</tspan><tspan fill="#f59e0b" font-style="italic">in</tspan>
    </text>
  </g>
  <g filter="url(#appleShadow)" transform="translate(256, 360)">
    <rect x="-85" y="-28" width="170" height="56" rx="28" fill="url(#appleGold)"/>
    <text x="0" y="10" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="4">SAZA</text>
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

  console.log('Successfully generated Full-Page Shopping Bag icons with Belanjain + SAZA!');
}

generate().catch(console.error);
