import '../loadEnv.js';
import { getPayload } from 'payload';
import config from '../src/payload.config.js';

async function main() {
  const payload = await getPayload({
    config,
  });

  const product = await payload.findByID({
    collection: 'products',
    id: '6a6316edb73c1ca317563918',
  });

  console.log('=== Product 6a6316edb73c1ca317563918 ===');
  console.log('Name/Model:', product.name);
  console.log('Power:', product.power);
  console.log('CCT:', product.colourTemperature);
  console.log('Specifications JSON length:', product.specifications ? JSON.stringify(product.specifications).length : 'EMPTY');
  if (product.specifications) {
    console.log('Sample specs keys:', Object.keys(product.specifications));
  }

  // Count total products
  const products = await payload.find({
    collection: 'products',
    limit: 1,
  });
  console.log('Total Products in Payload:', products.totalDocs);

  // Count total SKUs
  const skus = await payload.find({
    collection: 'skus',
    limit: 1,
  });
  console.log('Total SKUs in Payload:', skus.totalDocs);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
