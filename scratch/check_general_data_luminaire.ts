import { getMongoClient } from '../src/utils/mongoClient';

async function run() {
  const client = await getMongoClient();
  try {
    const db = client.db('general_data');
    const luminaireCollection = db.collection('luminaire');
    const docs = await luminaireCollection.find({}).toArray();
    console.log(`Found ${docs.length} total documents in general_data.luminaire:`);
    for (let i = 0; i < Math.min(docs.length, 10); i++) {
      const d = docs[i];
      console.log(`- doc ${i}: customer_model_no_new = "${d.customer_model_no_new}", yk_model_no = "${d.yk_model_no}", series_name = "${d.series_name}"`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
