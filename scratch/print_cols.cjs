const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

function idxToCol(idx) {
  let temp = '';
  let i = idx;
  while (i >= 0) {
    temp = String.fromCharCode((i % 26) + 65) + temp;
    i = Math.floor(i / 26) - 1;
  }
  return temp;
}

const file = 'Fixture General data - Renzo Xchange.xlsx';
const wb = xlsx.readFile(file);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Headers count:', rawRows[1].length);
console.log('\n--- Printing all columns from col 80 to 120 ---');
for (let i = 80; i < Math.min(125, rawRows[1].length); i++) {
  const colLetter = idxToCol(i);
  console.log(`${colLetter} (idx ${i}, col ${i+1}): R1: "${rawRows[1][i]}" | R2: "${rawRows[2][i]}" | R3: "${rawRows[3][i]}" | Sample: "${rawRows[4][i]}"`);
}
