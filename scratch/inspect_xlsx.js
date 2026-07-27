import * as xlsx from 'xlsx';
import fs from 'fs';

function inspect(filePath) {
  console.log(`=== Inspecting ${filePath} ===`);
  const buffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total rows: ${rawRows.length}`);
  
  // Log first 10 rows
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    console.log(`Row ${i}:`, (rawRows[i] || []).slice(0, 15));
  }
}

try {
  inspect('./Fixture General data - Berto backlit.xlsx');
  inspect('./product mm code_berto_backlit.xlsx');
} catch (e) {
  console.error(e);
}
