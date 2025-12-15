const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// PNG file generator using pure Node.js (creates valid PNG with gradient)
function createPNG(size, filename, isAppleIcon = false) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // Helper to create CRC
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  
  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crcValue = Buffer.alloc(4);
    crcValue.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([length, typeBuffer, data, crcValue]);
  }
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr.writeUInt8(8, 8);        // bit depth
  ihdr.writeUInt8(2, 9);        // color type (RGB)
  ihdr.writeUInt8(0, 10);       // compression
  ihdr.writeUInt8(0, 11);       // filter
  ihdr.writeUInt8(0, 12);       // interlace
  
  // Create image data with gradient - Teal/Cyan theme for customer portal
  const rawData = [];
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Gradient from teal to cyan
      const t = y / size;
      
      if (dist < radius) {
        // White "C" letter area (simplified as circle)
        const innerRadius = radius * 0.6;
        const letterWidth = radius * 0.25;
        
        if (dist > innerRadius - letterWidth && dist < innerRadius + letterWidth) {
          // Check if we're in the "C" opening (right side)
          const angle = Math.atan2(dy, dx);
          if (angle > -Math.PI/3 && angle < Math.PI/3) {
            // Opening of C - show background
            rawData.push(Math.floor(20 + t * 30));   // R - dark teal
            rawData.push(Math.floor(150 + t * 50));  // G
            rawData.push(Math.floor(180 + t * 30));  // B
          } else {
            // White letter
            rawData.push(255);
            rawData.push(255);
            rawData.push(255);
          }
        } else {
          // Inside circle - gradient background
          rawData.push(Math.floor(20 + t * 30));
          rawData.push(Math.floor(150 + t * 50));
          rawData.push(Math.floor(180 + t * 30));
        }
      } else {
        // Outside circle - gradient background
        rawData.push(Math.floor(20 + t * 30));
        rawData.push(Math.floor(150 + t * 50));
        rawData.push(Math.floor(180 + t * 30));
      }
    }
  }
  
  // Compress with zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  
  // Assemble PNG
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  
  fs.writeFileSync(path.join(iconsDir, filename), png);
  console.log(`Created ${filename} (${size}x${size})`);
}

// Generate all required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  createPNG(size, `icon-${size}x${size}.png`);
});

// Create apple touch icon
createPNG(180, 'apple-touch-icon.png', true);

// Create maskable icon
createPNG(512, 'maskable-icon-512x512.png');

// Create favicon
createPNG(32, 'favicon-32x32.png');

console.log('\n✅ All PWA icons generated successfully!');
