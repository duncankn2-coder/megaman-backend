import '../loadEnv.js';
import { getMongoClient } from '../src/utils/mongoClient';
import { getPayload } from 'payload';
import config from '../src/payload.config';

async function main() {
  const payload = await getPayload({ config });

  // 1. Search Payload for Fonda products
  const products = await payload.find({
    collection: 'products',
    where: {
      name: { contains: 'Fonda' }
    },
    depth: 2,
    limit: 5
  });

  console.log(`Found ${products.totalDocs} products matching Fonda`);
  for (const prod of products.docs) {
    console.log(`\n=== Product ID: ${prod.id} | Name: ${prod.name} ===`);
    console.log('  techDocControlGear:', prod.techDocControlGear);
    console.log('  Product specs keys:', prod.specifications ? Object.keys(prod.specifications) : 'EMPTY');
    console.log('  driver_model in product.specifications:', prod.specifications ? (prod.specifications as any).driver_model : 'N/A');

    // Fetch SKUs for this product
    const skus = await payload.find({
      collection: 'skus',
      where: { product: { equals: prod.id } },
      limit: 5
    });

    console.log(`  SKUs count: ${skus.totalDocs}`);
    for (const sku of skus.docs) {
      console.log(`    SKU ID: ${sku.id} | Name: ${sku.name}`);
      console.log('    SKU driver_model:', sku.specifications ? (sku.specifications as any).driver_model : 'N/A');
    }
  }

  // 2. Search mongo luminaire collection directly for Fonda
  const client = await getMongoClient();
  const db = client.db('general_data');
  const fontaLum = await db.collection('luminaire').find({
    $or: [
      { customer_model_no_new: { $regex: /fonda|f503/i } },
      { series_name: { $regex: /fonda/i } }
    ]
  }).limit(5).toArray();

  console.log(`\n=== Luminaire DB docs matching Fonda: ${fontaLum.length} ===`);
  for (const doc of fontaLum) {
    console.log(`  Art_Nr: ${doc.Art_Nr} | customer_model_no_new: ${doc.customer_model_no_new}`);
    console.log(`  driver_model (Col DU): ${JSON.stringify(doc.driver_model)}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
