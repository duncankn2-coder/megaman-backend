import { getMongoClient } from '../src/utils/mongoClient.js';

async function run() {
  const client = await getMongoClient();
  const db = client.db('general_data');
  
  console.log('--- Searching in general_data.luminaire ---');
  const luminaire = db.collection('luminaire');
  const docs1 = await luminaire.find({
    $or: [
      { customer_model_no_new: { $regex: /FCL76/i } },
      { yk_model_no: { $regex: /FCL76/i } },
      { Art_Nr: { $regex: /FCL76/i } }
    ]
  }).toArray();
  console.log(`Found ${docs1.length} docs in luminaire:`);
  for (const d of docs1) {
    console.log({
      _id: d._id,
      customer_model_no_new: d.customer_model_no_new,
      yk_model_no: d.yk_model_no
    });
  }

  console.log('\n--- Searching in general_data.light_source ---');
  const lightSource = db.collection('light_source');
  const docs2 = await lightSource.find({
    $or: [
      { new_erp_model_no: { $regex: /FCL76/i } },
      { yk_model_no: { $regex: /FCL76/i } },
      { model_identifier: { $regex: /FCL76/i } },
      { mm_code: { $regex: /FCL76/i } }
    ]
  }).toArray();
  console.log(`Found ${docs2.length} docs in light_source:`);
  for (const d of docs2) {
    console.log({
      _id: d._id,
      new_erp_model_no: d.new_erp_model_no,
      yk_model_no: d.yk_model_no,
      model_identifier: d.model_identifier,
      mm_code: d.mm_code
    });
  }
  
  process.exit(0);
}

run().catch(console.error);
