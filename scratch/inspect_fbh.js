const xlsx = require('xlsx');
const path = require('path');

function checkFile(filePath) {
  console.log('--- Checking:', filePath);
  try {
    const wb = xlsx.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find row containing FBH71500
    rows.forEach((row, i) => {
      const rowStr = JSON.stringify(row);
      if (rowStr.includes('FBH71500') || rowStr.includes('FBH') || rowStr.includes('LA10218')) {
        console.log(`Row ${i}:`, row);
      }
    });
  } catch (e) {
    console.error(e.message);
  }
}

checkFile('../Fixture General data - Renzo Xchange.xlsx');
checkFile('../product mm code_renzo_xchange.xlsx');
