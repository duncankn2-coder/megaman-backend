import { processXlsxToJson } from '../src/utils/xlsxToJsonConverter.js';
import fs from 'fs';

async function run() {
  const buffer = fs.readFileSync('./Fixture General data - Berto backlit.xlsx');
  const specs = await processXlsxToJson(buffer);
  console.log(`Parsed ${specs.length} specs rows.`);
  if (specs.length > 0) {
    console.log('Sample Row keys and values:', specs[0]);
  }
}

run().catch(console.error);
