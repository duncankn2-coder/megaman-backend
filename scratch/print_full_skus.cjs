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
    console.log(JSON.stringify(s, null, 2));
  }

  await client.close();
}

run().catch(console.error);
