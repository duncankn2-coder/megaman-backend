const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const mediaCollection = db.collection('media');
    
    const docs = await mediaCollection.find({
      $or: [
        { filename: /FPL71900/i },
        { alt: /FPL71900/i }
      ]
    }).toArray();
    
    console.log(`Found ${docs.length} matching media docs:`);
    console.log(JSON.stringify(docs, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
