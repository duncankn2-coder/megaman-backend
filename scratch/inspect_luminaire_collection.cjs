const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    
    // List all collections to see what we have
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Try finding in general_data.luminaire
    const luminaireColl = db.collection('general_data.luminaire');
    if (luminaireColl) {
      console.log('Searching in general_data.luminaire for FDS74600...');
      const results = await luminaireColl.find({ 
        $or: [
          { model_number: /FDS74600/i },
          { customer_model_no_new: /FDS74600/i },
          { customer_model_no_old: /FDS74600/i },
          { yk_product_code: /FDS74600/i }
        ]
      }).toArray();
      console.log('Results in general_data.luminaire:', JSON.stringify(results, null, 2));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
