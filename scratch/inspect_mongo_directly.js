import { getMongoClient } from '../src/utils/mongoClient.js';

async function run() {
  const client = await getMongoClient();
  const db = client.db('general_data');
  const collection = db.collection('luminaire');
  const docs = await collection.find({}).toArray();
  
  console.log(`Total documents in general_data.luminaire: ${docs.length}`);
  for (const d of docs) {
    console.log({
      _id: d._id,
      customer_model_no_new: d.customer_model_no_new,
      yk_model_no: d.yk_model_no
    });
  }
  process.exit(0);
}

run().catch(console.error);
