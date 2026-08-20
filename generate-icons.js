import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Modern, Clean, High-End App Icon for Belanjain SAZA
// Follows Apple & Google Material Design Guidelines (No tiny text clutter, crisp signature icon)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Belanjain SAZA Brand Gradient -->
    <linearGradient id="brandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="40%" stop-color="#0d9488"/>
      <stop offset="80%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <!-- Subtle Top Glass Gloss -->
    <linearGradient id="glassGloss" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Soft Depth Shadow for Icon Symbol -->
    <filter id="symbolShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#042f2e" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Base Squircle Container -->
  <rect x="24" y="24" width="464" height="464" rx="116" fill="url(#brandGrad)" />
  
  <!-- Subtle Glass Highlight Arc -->
  <rect x="24" y="24" width="464" height="232" rx="116" fill="url(#glassGloss)" />

  <!-- Crisp Shopping Bag Signature Symbol -->
  <g filter="url(#symbolShadow)" transform="translate(136, 136) scale(10.0)" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </g>
</svg>
`;

// Android Adaptive Maskable Icon (Full bleed background, safe zone symbol)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="brandGradFull" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="40%" stop-color="#0d9488"/>
      <stop offset="80%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="maskShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#042f2e" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Full Bleed Background (Covering 100% of the canvas so Android circle mask looks flawless) -->
  <rect width="512" height="512" fill="url(#brandGradFull)" />

  <!-- Center Shopping Bag in Safe Area (~60% of total canvas) -->
  <g filter="url(#maskShadow)" transform="translate(148, 148) scale(9.0)" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </g>
</svg>
`;

// iOS Apple Touch Icon (Full bleed square, iOS adds its own squircle radius)
const appleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="appleGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="40%" stop-color="#0d9488"/>
      <stop offset="80%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="appleShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#042f2e" flood-opacity="0.3"/>
    </filter>
  </defs>

  <rect width="180" height="180" fill="url(#appleGrad)" />
  <g filter="url(#appleShadow)" transform="translate(48, 48) scale(3.5)" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Generate standard 512x512 and 192x192 icons
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 2. Generate Android adaptive maskable icon (512x512)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));

  // 3. Generate Apple Touch Icon (180x180)
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Successfully generated clean & modern Belanjain SAZA icons!');
}

generate().catch(console.error);
