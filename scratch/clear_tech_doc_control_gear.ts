import { getMongoClient } from '../src/utils/mongoClient';

async function main() {
  const client = await getMongoClient();
  const db = client.db('test');
  
  const result = await db.collection('products').updateMany(
    { techDocControlGear: { $exists: true, $ne: null } },
    { $set: { techDocControlGear: null } }
  );

  console.log(`Cleared techDocControlGear on ${result.modifiedCount} products (matched ${result.matchedCount}).`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
