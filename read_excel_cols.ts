import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

function getColName(colIdx: number): string {
  let temp = '';
  let idx = colIdx;
  while (idx >= 0) {
    temp = String.fromCharCode((idx % 26) + 65) + temp;
    idx = Math.floor(idx / 26) - 1;
  }
  return temp;
}

async function main() {
  const downloadsDir = 'c:/Users/duncankwan/Downloads';
  const files = fs.readdirSync(downloadsDir);
  const matchedFile = files.find(f => f.toLowerCase().includes('smart') && f.toLowerCase().includes('general') && f.endsWith('.xlsx'));
  
  if (!matchedFile) {
    console.error('No matching file found in Downloads');
    return;
  }
  
  const filePath = path.join(downloadsDir, matchedFile);
  console.log('Reading file:', filePath);
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Get raw rows
  const rawRows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  if (rawRows.length === 0) {
    console.log('Sheet is empty');
    return;
  }
  
  // Try to find column mappings
  const headers = rawRows[0] || [];
  const secondRow = rawRows[1] || [];
  const thirdRow = rawRows[2] || [];
  const fourthRow = rawRows[3] || [];
  
  console.log('Columns list:');
  for (let i = 0; i < Math.max(headers.length, secondRow.length, thirdRow.length, fourthRow.length); i++) {
    const colLetter = getColName(i);
    const h1 = headers[i] !== undefined ? String(headers[i]).trim().replace(/\r?\n/g, ' ') : '';
    const h2 = secondRow[i] !== undefined ? String(secondRow[i]).trim().replace(/\r?\n/g, ' ') : '';
    const h3 = thirdRow[i] !== undefined ? String(thirdRow[i]).trim().replace(/\r?\n/g, ' ') : '';
    const h4 = fourthRow[i] !== undefined ? String(fourthRow[i]).trim().replace(/\r?\n/g, ' ') : '';
    console.log(`${colLetter} (Col ${i + 1}): "${h1}" | "${h2}" | "${h3}" | "${h4}"`);
  }
}

main();
