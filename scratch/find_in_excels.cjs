const xlsx = require('xlsx');
const fs = require('fs');

const files = [
  'Fixture General data - Berto backlit.xlsx',
  'Fixture General data - Hagon 2.xlsx',
  'product mm code_berto_backlit.xlsx',
  '../product mm code_renzo_xchange.xlsx',
  '../Fixture General data - Renzo Xchange.xlsx',
  '../Lamps - General Data - test.xlsx'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    try {
      const wb = xlsx.readFile(f);
      for (const s of wb.SheetNames) {
        const rows = xlsx.utils.sheet_to_json(wb.Sheets[s], { header: 1 });
        rows.forEach((r, idx) => {
          const str = JSON.stringify(r);
          if (str.includes('12872') || str.includes('12992') || str.includes('FBH72100')) {
            console.log(`Found in ${f} [${s}] row ${idx}:`, r.slice(0, 15));
          }
        });
      }
    } catch (e) {
      console.error(f, e.message);
    }
  }
}
