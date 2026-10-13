const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('test');
  
  const skus = await db.collection('skus').find({
    name: { $in: ['MM12872', 'MM12992', 'MM12501'] }
  }).toArray();

  for (const s of skus) {
    console.log(`\n=================== SKU: ${s.name} ===================`);
    console.log('s.modelNumber:', s.modelNumber);
    console.log('s.product:', s.product);
    console.log('s.specifications keys:', Object.keys(s.specifications || {}));
    console.log('s.specifications.customer_model_no_new:', s.specifications?.customer_model_no_new);
    console.log('s.specifications.model_number:', s.specifications?.model_number);
    console.log('s.specifications.yk_model_no:', s.specifications?.yk_model_no);
    console.log('s.specifications.model_identifier:', s.specifications?.model_identifier);
    console.log('s.specifications.total_mains_efficacy_lmw:', s.specifications?.total_mains_efficacy_lmw);
    console.log('s.specifications.total_luminous_flux_lm:', s.specifications?.total_luminous_flux_lm);
    console.log('s.specifications.cct_k:', s.specifications?.cct_k);
    console.log('s.specifications.on_mode_power_w:', s.specifications?.on_mode_power_w);
  }

  await client.close();
}

run().catch(console.error);
