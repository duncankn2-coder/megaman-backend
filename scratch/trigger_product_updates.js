import '../loadEnv.js';
import { getPayload } from 'payload';
import config from '../src/payload.config.js';

async function main() {
  console.log('Initializing Payload...');
  const payload = await getPayload({
    config,
  });

  console.log('Fetching all products...');
  const result = await payload.find({
    collection: 'products',
    limit: 1000,
  });

  console.log(`Found ${result.docs.length} products. Triggering updates in parallel batches...`);

  const batchSize = 15;
  const docs = result.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} products)...`);
    await Promise.all(batch.map(async (doc) => {
      try {
        await payload.update({
          collection: 'products',
          id: doc.id,
          data: {
            name: doc.name,
          },
        });
        console.log(`Updated product: ${doc.name}`);
      } catch (err) {
        console.error(`Error updating product ${doc.name}:`, err.message);
      }
    }));
  }

  console.log('All product updates completed.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
