const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const skus = await db.collection('skus').find().toArray();
    console.log('SKUs in DB:');
    skus.forEach(s => {
      console.log(`- Name: ${s.name}, packingMethod: ${s.packingMethod}, remark: ${s.remark}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
