import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Define headers and mock data rows
const headers = [
  'Model Number',
  'Description',
  'Category',
  'Family',
  'Color',
  'Power',
  'Color Temperature',
  'Image File',
  'Datasheet PDF File',
  'LDT File',
  'IES File',
  'BIM Revit File'
];

const mockRows = [
  {
    'Model Number': 'F50309RC',
    'Description': 'TRIONA Round Recessed Luminaire, premium glare-free architectural ring light.',
    'Category': 'Recessed Luminaires',
    'Family': 'TRIONA',
    'Color': 'White',
    'Power': '33W',
    'Color Temperature': '3000K',
    'Image File': 'triona_round_white.jpg',
    'Datasheet PDF File': 'triona_datasheet.pdf',
    'LDT File': 'triona_round_3000k.ldt',
    'IES File': 'triona_round_3000k.ies',
    'BIM Revit File': 'triona_round.rfa'
  },
  {
    'Model Number': 'F50309RC-Black',
    'Description': 'TRIONA Round Recessed Luminaire, premium glare-free architectural ring light in sleek black finish.',
    'Category': 'Recessed Luminaires',
    'Family': 'TRIONA',
    'Color': 'Black',
    'Power': '33W',
    'Color Temperature': '4000K',
    'Image File': 'triona_round_black.jpg',
    'Datasheet PDF File': 'triona_datasheet.pdf',
    'LDT File': 'triona_round_4000k.ldt',
    'IES File': 'triona_round_4000k.ies',
    'BIM Revit File': 'triona_round.rfa'
  }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(mockRows, { header: headers });

// Set column widths to look beautiful
ws['!cols'] = [
  { wch: 18 }, // Model Number
  { wch: 45 }, // Description
  { wch: 22 }, // Category
  { wch: 15 }, // Family
  { wch: 10 }, // Color
  { wch: 10 }, // Power
  { wch: 20 }, // Color Temperature
  { wch: 22 }, // Image File
  { wch: 22 }, // Datasheet PDF File
  { wch: 22 }, // LDT File
  { wch: 22 }, // IES File
  { wch: 22 }  // BIM Revit File
];

xlsx.utils.book_append_sheet(wb, ws, 'Template');

const publicDir = './public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

xlsx.writeFile(wb, path.join(publicDir, 'importer_template.xlsx'));
console.log('Template created successfully in public/importer_template.xlsx');
