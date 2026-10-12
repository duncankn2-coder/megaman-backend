const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('general_data');
  const lumColl = db.collection('luminaire');
  const docs = await lumColl.find({
    beam_angle: { $gt: 360 }
  }).toArray();
  console.log(`Docs with beam_angle > 360: ${docs.length}`);
  docs.forEach(d => {
    console.log(`${d.customer_model_no_new || d.yk_model_no} (${d.series_name}): beam_angle = ${d.beam_angle} | desc = ${(d.description || '').substring(0, 60)}`);
  });
  await client.close();
}

check().catch(console.error);
