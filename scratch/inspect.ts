import '../loadEnv';
import * as xlsx from 'xlsx';
import fs from 'fs';

async function run() {
  console.log('--- Inspecting Modified Excel File ---');
  try {
    const fileBuffer = fs.readFileSync('../Lamps - General Data - test.xlsx');
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    console.log('Sheets in workbook:', workbook.SheetNames);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    console.log(`Total rows in ${sheetName}:`, rawRows.length);
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      console.log(`Row ${i}:`, rawRows[i]?.slice(0, 10));
    }
  } catch (err: any) {
    console.error('Error reading xlsx:', err.message);
  }
  process.exit(0);
}

run();
