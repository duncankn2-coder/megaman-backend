const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const mediaCollection = db.collection('media');
    
    // Find newest 20 media documents
    const docs = await mediaCollection.find({}).sort({ _id: -1 }).limit(20).toArray();
    console.log(`Newest 20 media docs in DB:`);
    docs.forEach(d => {
      console.log(`- ID: ${d._id}, filename: ${d.filename}, alt: ${d.alt}, createdAt: ${d.createdAt}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
