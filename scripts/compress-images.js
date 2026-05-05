const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '../client/public/images');
const imagesToCompress = ['bg-scene.png', 'og-share.png'];

async function compressImages() {
  for (const img of imagesToCompress) {
    const inputPath = path.join(publicDir, img);
    const outputPath = path.join(publicDir, img.replace('.png', '.webp'));

    if (fs.existsSync(inputPath)) {
      console.log(`Compressing ${img}...`);
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
      console.log(`Successfully created ${path.basename(outputPath)}`);
    } else {
      console.log(`Skipped ${img}: file not found.`);
    }
  }
}

compressImages().catch(console.error);
