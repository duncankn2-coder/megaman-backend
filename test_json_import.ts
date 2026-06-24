import './loadEnv';
import { getPayload } from 'payload';
import config from './src/payload.config';
import fs from 'fs';

async function main() {
  const payload = await getPayload({ config });
  
  const jsonRaw = fs.readFileSync('c:/Users/duncankwan/Downloads/Fixture General data - Fonda Xchange_converted.json', 'utf8');
  const items = JSON.parse(jsonRaw);
  
  console.log(`Running import simulation on all ${items.length} items...`);
  
  try {
    const { processJsonImport } = await import('./src/utils/jsonImporter');
    const result = await processJsonImport(payload, items);
    console.log('Simulation complete. Result success:', result.success);
    console.log('Warnings count:', result.warnings.length);
    if (result.warnings.length > 0) {
      console.log('First 5 warnings:', result.warnings.slice(0, 5));
    }
  } catch (err: any) {
    console.error('CRITICAL UNCAUGHT IMPORT ERROR:', err);
    if (err.data) {
      console.error('Error details:', JSON.stringify(err.data, null, 2));
    }
  }
  process.exit(0);
}

main();
