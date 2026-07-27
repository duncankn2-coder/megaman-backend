import '../loadEnv.js';
import fs from 'fs';
import { getPayload } from 'payload';
import config from '../src/payload.config.js';
import { processSkuBulkImport } from '../src/utils/skuBulkImporter.js';

async function main() {
  console.log('Initializing Payload...');
  const payload = await getPayload({
    config,
  });

  console.log('Payload initialized. Loading file buffers...');
  
  const generalXlsxPath = '../Fixture General data - Renzo Xchange.xlsx';
  const skuXlsxPath = '../product mm code_renzo_xchange.xlsx';
  const zipPath = './test_assets.zip';

  const generalXlsxBuffer = fs.readFileSync(generalXlsxPath);
  const skuXlsxBuffer = fs.readFileSync(skuXlsxPath);
  const zipBuffer = fs.existsSync(zipPath) ? fs.readFileSync(zipPath) : Buffer.alloc(0);

  console.log('Starting Sku Bulk Import for Renzo Xchange...');
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

  process.exit(0);
}

main().catch(err => {
  console.error('Error in import script:', err);
  process.exit(1);
});
