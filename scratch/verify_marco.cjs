const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('general_data');
  const lumColl = db.collection('luminaire');
  const docs = await lumColl.find({
    yk_model_no: { $regex: '73000|73100|73200', $options: 'i' }
  }).toArray();
  console.log('--- Marco Luminaire General Data ---');
  docs.forEach(d => {
    console.log(`${d.yk_model_no} | ${d.customer_model_no_new}: beam_angle = ${JSON.stringify(d.beam_angle)}`);
  });

  const skuColl = client.db('test').collection('skus');
  const skus = await skuColl.find({
    'specifications.beam_angle': { $regex: '24/|25/', $options: 'i' }
  }).toArray();
  console.log(`--- SKUs with compound beam_angle: ${skus.length} ---`);
  skus.forEach(s => {
    console.log(`${s.model_no || s.sku_code || s._id}: beam_angle = ${JSON.stringify(s.specifications?.beam_angle)}`);
  });

  await client.close();
}

check().catch(console.error);
