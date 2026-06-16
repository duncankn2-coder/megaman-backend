const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const mediaCollection = db.collection('media');
    
    // Find media created today (June 16, 2026)
    const today = new Date('2026-06-16T00:00:00Z');
    const docs = await mediaCollection.find({
      _id: { $gt: new ObjectId(Math.floor(today.getTime() / 1000).toString(16) + '0000000000000000') }
    }).toArray();
    
    console.log(`Found ${docs.length} media docs created today:`);
    docs.forEach(d => {
      console.log(`- ID: ${d._id}, filename: ${d.filename}, alt: ${d.alt}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
