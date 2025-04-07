const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const floorplansDir = path.join(__dirname, 'floorplans');
const mapsFile = path.join(__dirname, 'maps.json');

function getBaseName(file) {
  return path.basename(file, '.png');
}

async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return [[0, 0], [metadata.width, metadata.height]];
  } catch (err) {
    console.error(`Error reading image: ${filePath}`, err);
    return [[0, 0], [1000, 1000]]; // fallback
  }
}

(async () => {
  const files = fs.readdirSync(floorplansDir);

  const pngs = files.filter(f => f.endsWith('.png'));
  const baseNames = pngs.map(getBaseName);

  // Step 1: Clean up orphaned .json files
  const jsons = files.filter(f => f.endsWith('.bounds.json') || f.endsWith('.annotations.json'));
  for (const jsonFile of jsons) {
    const base = jsonFile.replace(/\.(bounds|annotations)\.json$/, '');
    if (!baseNames.includes(base)) {
      console.log(`Deleting orphan JSON: ${jsonFile}`);
      fs.unlinkSync(path.join(floorplansDir, jsonFile));
    }
  }

  // Step 2: Ensure bounds and annotations for each PNG
  for (const base of baseNames) {
    const pngPath = path.join(floorplansDir, `${base}.png`);
    const boundsPath = path.join(floorplansDir, `${base}.bounds.json`);
    const annotationsPath = path.join(floorplansDir, `${base}.annotations.json`);

    if (!fs.existsSync(boundsPath)) {
      const bounds = await getImageDimensions(pngPath);
      fs.writeFileSync(boundsPath, JSON.stringify(bounds, null, 2));
      console.log(`Created bounds for: ${base}`);
    }

    if (!fs.existsSync(annotationsPath)) {
      fs.writeFileSync(annotationsPath, '[]');
      console.log(`Created empty annotations for: ${base}`);
    }
  }

  // Step 3: Write maps.json
  baseNames.sort();
  fs.writeFileSync(mapsFile, JSON.stringify(baseNames, null, 2));
  console.log('✅ Updated maps.json');

})();
