const AdmZip = require('adm-zip');
const path = require('path');

const modelNo = 'FPL71900v0-ex/ta+LD247038-C0900';

async function run() {
  const zip = new AdmZip('./test_assets.zip');
  const zipEntries = zip.getEntries();
  
  const filesMap = new Map();
  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    const filename = path.basename(entry.entryName).toLowerCase();
    filesMap.set(filename, entry);
  }
  
  const normalizedModels = [
    modelNo,
    modelNo.replace(/\//g, '-'),
    modelNo.replace(/\//g, '_'),
    modelNo.replace(/\//g, ' '),
  ];
  
  const imageFallbacks = [];
  for (const m of normalizedModels) {
    imageFallbacks.push(`${m}.png`, `${m}.jpg`, `${m}.jpeg`);
  }
  
  console.log('Normalized Models:', normalizedModels);
  console.log('Image Fallbacks:', imageFallbacks);
  
  for (const pattern of imageFallbacks) {
    const tryName = pattern.toLowerCase();
    const entry = filesMap.get(tryName);
    console.log(`Checking tryName: "${tryName}" -> Found: ${!!entry}`);
    if (entry) {
      console.log(`Matched entry name: "${entry.entryName}"`);
    }
  }
}

run();
