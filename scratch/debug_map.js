import { LUMINAIRE_KEYS, COLUMN_SYNONYMS, findHeadersRowIndex } from '../src/utils/xlsxToJsonConverter.js';
import * as xlsx from 'xlsx';
import fs from 'fs';

function run() {
  const buffer = fs.readFileSync('./Fixture General data - Berto backlit.xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  const headersRowIdx = findHeadersRowIndex(rawRows);
  console.log(`Detected headersRowIdx: ${headersRowIdx}`);
  
  const rawHeaders = rawRows[headersRowIdx] || [];
  const headers = [];
  for (let i = 0; i < rawHeaders.length; i++) {
    headers.push(String(rawHeaders[i] || '').trim().toLowerCase());
  }

  console.log('Headers in Sheet:', headers.slice(0, 15));

  const key = 'customer_model_no_new';
  const synonyms = COLUMN_SYNONYMS[key] || [];
  
  let matchedIndex = -1;
  for (const syn of synonyms) {
    matchedIndex = headers.findIndex(h => h === syn);
    if (matchedIndex !== -1) {
      console.log(`Exact match synonym found: "${syn}" at index ${matchedIndex}`);
      break;
    }
  }
  
  if (matchedIndex === -1) {
    for (const syn of synonyms) {
      matchedIndex = headers.findIndex(h => h.includes(syn));
      if (matchedIndex !== -1) {
        console.log(`Substring match synonym found: "${syn}" at index ${matchedIndex}`);
        break;
      }
    }
  }

  console.log(`FinalIndex for ${key} is ${matchedIndex}`);
}

run();
