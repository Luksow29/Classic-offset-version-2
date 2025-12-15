// Generate PWA icons using Sharp
// Run with: node generate-pwa-icons.cjs

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG template for the icon
function createIconSVG(size, isMaskable = false) {
  const radius = isMaskable ? 0 : size * 0.2;
  const fontSize = isMaskable ? size * 0.35 : size * 0.42;
  const textY = isMaskable ? size / 2 : size / 2 + size * 0.05;
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${radius}" fill="url(#grad)"/>
      <text x="${size/2}" y="${textY}" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}" 
            font-weight="700" 
            fill="white" 
            text-anchor="middle" 
            dominant-baseline="middle">CO</text>
    </svg>
  `;
}

async function generateIcons() {
  console.log('Generating PWA icons...\n');
  
  // Generate regular icons
  for (const size of sizes) {
    const svg = createIconSVG(size, false);
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }
  
  // Generate maskable icon (512x512)
  const maskableSvg = createIconSVG(512, true);
  await sharp(Buffer.from(maskableSvg))
    .png()
    .toFile(path.join(iconsDir, 'maskable-icon-512x512.png'));
  console.log('✓ Generated maskable-icon-512x512.png');
  
  // Generate apple touch icon (180x180)
  const appleSvg = createIconSVG(180, false);
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');
  
  // Generate favicon (32x32)
  const faviconSvg = createIconSVG(32, false);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(path.join(iconsDir, 'favicon-32x32.png'));
  console.log('✓ Generated favicon-32x32.png');
  
  console.log('\n✅ All PWA icons generated successfully!');
  console.log(`Icons saved to: ${iconsDir}`);
}

generateIcons().catch(console.error);
