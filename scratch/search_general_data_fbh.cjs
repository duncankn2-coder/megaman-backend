const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('general_data');
  const coll = db.collection('luminaire');

  const docs = await coll.find({
    $or: [
      { customer_model_no_new: { $regex: /FBH72100/i } },
      { customer_model_no_old: { $regex: /FBH72100/i } },
      { yk_model_no: { $regex: /FBH72100/i } },
      { yk_product_code: { $regex: /12872|12992|12501/i } },
      { customer_model_no_new: { $regex: /12872|12992|12501/i } }
    ]
  }).toArray();

  console.log(`Found ${docs.length} documents in general_data.luminaire:`);
  for (const d of docs) {
    console.log({
      _id: d._id,
      series_name: d.series_name,
      customer_model_no_old: d.customer_model_no_old,
      customer_model_no_new: d.customer_model_no_new,
      yk_product_code: d.yk_product_code,
      yk_model_no: d.yk_model_no,
      on_mode_power_w: d.on_mode_power_w,
      cct_k: d.cct_k,
      total_luminous_flux_lm: d.total_luminous_flux_lm,
      total_mains_efficacy_lmw: d.total_mains_efficacy_lmw,
    });
  }

  await client.close();
}

run().catch(console.error);
