const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const productsCollection = db.collection('products');
    
    // Find products that have specifications
    const doc = await productsCollection.findOne({ specifications: { $exists: true, $ne: null } });
    if (doc) {
      console.log('Payload Product with specs:', JSON.stringify(doc, null, 2));
    } else {
      console.log('No products found with specifications field. Finding any product with specifications key...');
      const docAny = await productsCollection.findOne({ specifications: { $exists: true } });
      console.log('Any product with specifications key:', JSON.stringify(docAny, null, 2));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
