const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const productsCollection = db.collection('products');
    const mediaCollection = db.collection('media');
    
    const product = await productsCollection.findOne({ name: 'FPL71900v0-ex/ta+LD247038-C0900' });
    console.log('Product in DB:', JSON.stringify(product, null, 2));
    
    if (product && product.images) {
      const media = await mediaCollection.findOne({ _id: product.images });
      console.log('Media in DB for product.images:', JSON.stringify(media, null, 2));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
