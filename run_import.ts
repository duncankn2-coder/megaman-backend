import './loadEnv';
import fs from 'fs';
import { getPayload } from 'payload';
import config from './src/payload.config';
import { processSkuBulkImport } from './src/utils/skuBulkImporter';

async function main() {
  console.log('Initializing Payload...');
  const payload = await getPayload({
    config,
  });

  console.log('Payload initialized. Loading file buffers...');
  
  const generalXlsxPath = './Fixture General data - Berto backlit.xlsx';
  const skuXlsxPath = './product mm code_berto_backlit.xlsx';
  const zipPath = './test_assets.zip';

  const generalXlsxBuffer = fs.readFileSync(generalXlsxPath);
  const skuXlsxBuffer = fs.readFileSync(skuXlsxPath);
  const zipBuffer = fs.readFileSync(zipPath);

  console.log('Starting Sku Bulk Import...');
  const result = await processSkuBulkImport(payload, generalXlsxBuffer, skuXlsxBuffer, zipBuffer);

  console.log('\n=== Import Summary ===');
  console.log(`Success: ${result.success}`);
  console.log(`Products Created: ${result.productsCreated}`);
  console.log(`Products Updated: ${result.productsUpdated}`);
  console.log(`SKUs Created: ${result.skusCreated}`);
  console.log(`SKUs Updated: ${result.skusUpdated}`);
  
  if (result.warnings.length > 0) {
    console.log('\n=== Warnings ===');
    result.warnings.forEach(w => console.warn(`- ${w}`));
  }

  console.log('\n=== Logs ===');
  result.logs.forEach(l => console.log(l));

  process.exit(0);
}

main().catch(err => {
  console.error('Error in import script:', err);
  process.exit(1);
});
