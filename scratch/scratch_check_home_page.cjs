const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const globalsCollection = db.collection('globals');
    
    const homepage = await globalsCollection.findOne({ slug: 'home-page' });
    console.log('Homepage document in DB:', JSON.stringify(homepage, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
