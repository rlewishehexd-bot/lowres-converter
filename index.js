const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

// Input and output folders (relative to this script)
const inputRoot = './input';
const outputRoot = './output';

/**
 * Processes a single image file using the sharp library.
 * @param {string} inputPath - Path to the input image file.
 * @param {string} outputPath - Path to save the processed image.
 * @param {string} extLower - Lowercase file extension.
 */
async function processImage(inputPath, outputPath, extLower) {
  try {
    const buffer = await fs.readFile(inputPath);

    // Sharp automatically handles EXIF orientation by default, so no manual correction is needed.
    // We just read the image and pipe it to the resize operation.
    let image = sharp(buffer);

    await image
      .resize({ height: 150, fit: sharp.fit.inside })
      .withMetadata()
      .toFile(outputPath);

    console.log(`✅ Processed: ${inputPath} → ${outputPath}`);
  } catch (err) {
    console.error(`❌ Error processing ${inputPath}: ${err.message}`);
  }
}

/**
 * Recursively processes all images in a directory.
 * @param {string} inputDir - The input directory to scan.
 * @param {string} outputDir - The output directory to save files.
 */
async function processDirectory(inputDir, outputDir) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    const entries = await fs.readdir(inputDir, { withFileTypes: true });

    for (const entry of entries) {
      const inputPath = path.join(inputDir, entry.name);

      if (entry.isDirectory()) {
        const outSub = path.join(outputDir, entry.name);
        await processDirectory(inputPath, outSub);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        const extLower = ext.toLowerCase();

        if (
          ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp'].includes(
            extLower
          )
        ) {
          const outputPath = path.join(outputDir, entry.name);
          await processImage(inputPath, outputPath, extLower);
        }
      }
    }
  } catch (err) {
    console.error('❌ Critical error in processDirectory:', err);
  }
}

// Main runner
(async () => {
  try {
    await fs.mkdir(outputRoot, { recursive: true });
    await processDirectory(inputRoot, outputRoot);
    console.log('\n🎉 All done! Resized images are in ./output/');
  } catch (err) {
    console.error('❌ Critical error:', err);
  }
})();
