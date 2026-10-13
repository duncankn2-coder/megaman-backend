const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('test');
  
  const p = await db.collection('products').findOne({ _id: new ObjectId('6a91422024325f955e3f6997') });
  console.log('Product 6a91422024325f955e3f6997:');
  console.log('name:', p.name);
  console.log('power:', p.power);
  console.log('specifications.customer_model_no_new:', p.specifications?.customer_model_no_new);
  console.log('specifications.on_mode_power_w:', p.specifications?.on_mode_power_w);
  console.log('specifications.total_mains_efficacy_lmw:', p.specifications?.total_mains_efficacy_lmw);
  console.log('specifications.total_luminous_flux_lm:', p.specifications?.total_luminous_flux_lm);

  await client.close();
}

run().catch(console.error);
