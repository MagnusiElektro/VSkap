const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const floorplansDir = path.join(__dirname, 'floorplans');
const mapsFile = path.join(__dirname, 'maps.json');

// Flip width/height to match Leaflet's [Y, X] format
async function getImageDimensions(filePath) {
  try {
    const { width, height } = await sharp(filePath)
      .rotate() // auto-correct orientation
      .metadata();

    // Leaflet expects bounds as [[y1, x1], [y2, x2]]
    return [[0, 0], [height || 1000, width || 1000]];
  } catch (err) {
    console.warn(`⚠️ Skipping ${filePath} — unsupported format or read error.`);
    return null;
  }
}

(async () => {
  const files = fs.readdirSync(floorplansDir);

  const pngs = files.filter(f => f.endsWith('.png'));
  const baseNames = pngs.map(f => path.basename(f, '.png'));

  // Clean up orphaned .json files
  const jsons = files.filter(f => f.endsWith('.bounds.json') || f.endsWith('.annotations.json'));
  for (const jsonFile of jsons) {
    const base = jsonFile.replace(/\.(bounds|annotations)\.json$/, '');
    if (!baseNames.includes(base)) {
      console.log(`🧹 Deleting orphan JSON: ${jsonFile}`);
      fs.unlinkSync(path.join(floorplansDir, jsonFile));
    }
  }

  // Create missing bounds/annotations
  for (const base of baseNames) {
    const pngPath = path.join(floorplansDir, `${base}.png`);
    const boundsPath = path.join(floorplansDir, `${base}.bounds.json`);
    const annotationsPath = path.join(floorplansDir, `${base}.annotations.json`);

    if (!fs.existsSync(boundsPath)) {
      const bounds = await getImageDimensions(pngPath);
      if (bounds) {
        fs.writeFileSync(boundsPath, JSON.stringify(bounds, null, 2));
        console.log(`✅ Created bounds for: ${base}`);
      }
    }

    if (!fs.existsSync(annotationsPath)) {
      fs.writeFileSync(annotationsPath, '[]');
      console.log(`✅ Created empty annotations for: ${base}`);
    }
  }

  // Update maps.json
  baseNames.sort();
  fs.writeFileSync(mapsFile, JSON.stringify(baseNames, null, 2));
  console.log('✅ Updated maps.json');
})();
