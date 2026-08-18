const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1;
}

const targetCols = ['CO', 'CQ', 'CU', 'CV', 'CX', 'CY', 'CZ', 'DI'];
console.log('Target cols indices (0-based / 1-based):');
targetCols.forEach(c => console.log(c, colToIdx(c), colToIdx(c) + 1));

const files = [
  'Fixture General data - Renzo Xchange.xlsx',
  'megaman-backend/Fixture General data - Berto backlit.xlsx',
  'megaman-backend/Fixture General data - Hagon 2.xlsx',
  'Lamps - General Data - test.xlsx'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    console.log('\n=================== File:', f, '===================');
    const wb = xlsx.readFile(f);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Total rows:', rawRows.length);
    for (const c of targetCols) {
      const idx = colToIdx(c);
      const val0 = rawRows[0] ? rawRows[0][idx] : undefined;
      const val1 = rawRows[1] ? rawRows[1][idx] : undefined;
      const val2 = rawRows[2] ? rawRows[2][idx] : undefined;
      const val3 = rawRows[3] ? rawRows[3][idx] : undefined;
      const dataSample = rawRows[4] ? rawRows[4][idx] : undefined;
      console.log(`Col ${c} (Col ${idx + 1}): [R0: "${val0}"] | [R1: "${val1}"] | [R2: "${val2}"] | [R3: "${val3}"] => Sample row 4: "${dataSample}"`);
    }
  }
}
