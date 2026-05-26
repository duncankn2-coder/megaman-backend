const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('general_data');
    const luminaireCollection = db.collection('luminaire');
    
    // Dump for FDM70600v0-ds/sc
    const doc1 = await luminaireCollection.findOne({ customer_model_no_new: 'FDM70600v0-ds/sc' });
    console.log('Document for FDM70600v0-ds/sc:', JSON.stringify(doc1, null, 2));

    // Dump for FDL71300v0-ds/sc
    const doc2 = await luminaireCollection.findOne({ customer_model_no_new: 'FDL71300v0-ds/sc' });
    console.log('Document for FDL71300v0-ds/sc:', JSON.stringify(doc2, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
