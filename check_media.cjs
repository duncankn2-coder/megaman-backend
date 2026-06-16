const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const mediaCollection = db.collection('media');
    
    const media = await mediaCollection.find({}).toArray();
    console.log(`Total media in DB: ${media.length}`);
    media.forEach(m => {
      console.log(`Media: ID: ${m._id}, filename: ${m.filename}, alt: ${m.alt}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
