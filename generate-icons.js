const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

const svgPath = path.join(__dirname, 'icons', 'musika.svg');
const resPath = path.join(__dirname, 'app', 'src', 'main', 'res');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const { name, size } of sizes) {
    const dir = path.join(resPath, name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));
    
    await sharp(svgBuffer)
      .resize(Math.round(size * 0.54), Math.round(size * 0.54))
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
    
    console.log(`Generated ${name} icons (${size}px)`);
  }
  
  const anydpiDir = path.join(resPath, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });
  
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`);
  
  console.log('Generated adaptive icon XML');
  console.log('Done!');
}

generateIcons().catch(console.error);
