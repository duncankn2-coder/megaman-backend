const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('test');
  
  const s1 = await db.collection('skus').findOne({ name: 'MM12872' });
  const s2 = await db.collection('skus').findOne({ name: 'MM12992' });

  console.log('--- MM12872 vs MM12992 ---');
  for (const k of Object.keys(s1)) {
    if (JSON.stringify(s1[k]) !== JSON.stringify(s2[k])) {
      console.log(`Difference in key "${k}":`);
      console.log('  MM12872:', s1[k]);
      console.log('  MM12992:', s2[k]);
    }
  }

  await client.close();
}

run().catch(console.error);
