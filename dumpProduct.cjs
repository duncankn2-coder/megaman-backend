const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('general_data');
    const luminaireCollection = db.collection('luminaire');
    const doc = await luminaireCollection.findOne({});
    console.log('Keys in document:', Object.keys(doc));
    console.log('Full Document:', JSON.stringify(doc, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
