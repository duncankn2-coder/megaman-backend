import { getMongoClient } from '../src/utils/mongoClient';

async function main() {
  const client = await getMongoClient();
  const db = client.db('general_data');
  const collection = db.collection('luminaire');

  const doc = await collection.findOne({
    driver_model: { $nin: [null, "", "N/A", "n/a"] }
  });

  if (doc) {
    console.log('=== All fields for doc with driver_model:', doc.driver_model, '===');
    const sortedKeys = Object.keys(doc).sort();
    for (const k of sortedKeys) {
      console.log(`${k}: ${JSON.stringify(doc[k])}`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
