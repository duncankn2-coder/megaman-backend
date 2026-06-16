const AdmZip = require('adm-zip');
const path = require('path');

try {
  const zip = new AdmZip('./test_assets.zip');
  const entries = zip.getEntries();
  console.log(`ZIP has ${entries.length} entries:`);
  entries.forEach(e => {
    if (!e.isDirectory) {
      console.log(`- ${e.entryName}`);
    }
  });
} catch (err) {
  console.error(err);
}
