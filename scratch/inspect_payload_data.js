import '../loadEnv.js';
import { getPayload } from 'payload';
import config from '../src/payload.config.js';

async function run() {
  const payload = await getPayload({ config });
  
  console.log('\n--- Inspecting Latest Products ---');
  const prods = await payload.find({
    collection: 'products',
    sort: '-createdAt',
    limit: 1
  });
  
  if (prods.docs.length > 0) {
    const prod = prods.docs[0];
    console.log(`Product Name: ${prod.name}`);
    console.log(`Has specifications: ${!!prod.specifications}`);
    if (prod.specifications) {
      console.log('Specifications Sample Keys:', Object.keys(prod.specifications).slice(0, 10));
    }
  } else {
    console.log('No products found.');
  }

  console.log('\n--- Inspecting Latest SKUs ---');
  const skus = await payload.find({
    collection: 'skus',
    sort: '-createdAt',
    limit: 2
  });

  for (const sku of skus.docs) {
    console.log(`SKU MM Code: ${sku.name}`);
    console.log(`Parent product: ${typeof sku.product === 'object' ? sku.product.name : sku.product}`);
    console.log(`Has specifications: ${!!sku.specifications}`);
    if (sku.specifications) {
      console.log('Specifications Sample Keys:', Object.keys(sku.specifications).slice(0, 10));
    }
  }
  
  process.exit(0);
}

run().catch(console.error);
