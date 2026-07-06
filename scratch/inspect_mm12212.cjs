const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const skusCollection = db.collection('skus');
    
    const sku = await skusCollection.findOne({ name: 'MM12212' });
    console.log('SKU details:', JSON.stringify(sku, null, 2));

    if (sku && sku.product) {
      const productsCollection = db.collection('products');
      const product = await productsCollection.findOne({ _id: sku.product });
      console.log('Parent Product details:', JSON.stringify(product, null, 2));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
