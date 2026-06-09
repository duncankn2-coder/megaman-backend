const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const mediaCollection = db.collection('media');
    
    const docs = await mediaCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log('Media documents sample:', JSON.stringify(docs, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
