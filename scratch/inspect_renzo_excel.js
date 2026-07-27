import * as xlsx from 'xlsx';
import fs from 'fs';

function run() {
  const filePath = '../Fixture General data - Renzo Xchange.xlsx';
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Total rows: ${rawRows.length}`);
  
  // Search for any row containing FCL76
  const matchingRows = [];
  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx] || [];
    const rowStr = JSON.stringify(row).toLowerCase();
    if (rowStr.includes('fcl76')) {
      matchingRows.push({ idx, row: row.slice(0, 15) });
    }
  }

  console.log(`Found ${matchingRows.length} matching rows:`);
  for (const match of matchingRows) {
    console.log(`Row ${match.idx}:`, match.row);
  }
}

run();
