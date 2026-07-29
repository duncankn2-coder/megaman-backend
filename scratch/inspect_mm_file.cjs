const xlsx = require('xlsx');

const wb = xlsx.readFile('../product mm code_renzo_xchange.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Headers:', rows[0]);
console.log('Row 1:', rows[1]);
console.log('Row 2:', rows[2]);
