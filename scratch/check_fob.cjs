const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function updateAndVerify() {
  const client = new MongoClient(uri);
  await client.connect();

  // 1. Update general_data.luminaire
  const lumRes = await client.db('general_data').collection('luminaire').updateOne(
    { customer_model_no_new: 'FOB83700v0-ds' },
    { $set: { length_mm: 1500 } }
  );
  console.log('general_data.luminaire updated count:', lumRes.modifiedCount);

  // 2. Update test.products specifications
  const prodRes = await client.db('test').collection('products').updateOne(
    { name: 'FOB83700v0-ds' },
    { $set: { 'specifications.length_mm': 1500 } }
  );
  console.log('test.products updated count:', prodRes.modifiedCount);

  // 3. Verify
  const lumDoc = await client.db('general_data').collection('luminaire').findOne({ customer_model_no_new: 'FOB83700v0-ds' });
  const prodDoc = await client.db('test').collection('products').findOne({ name: 'FOB83700v0-ds' });

  console.log('\n--- VERIFICATION ---');
  console.log('general_data.luminaire length_mm:', lumDoc ? lumDoc.length_mm : 'not found');
  console.log('test.products specifications.length_mm:', prodDoc?.specifications?.length_mm);

  await client.close();
}

updateAndVerify().catch(console.error);
