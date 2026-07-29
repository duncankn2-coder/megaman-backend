const { MongoClient } = require('mongodb');

async function checkAllProducts() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const products = await db.collection('products').find({}).toArray();

    console.log(`Total products in MongoDB: ${products.length}`);
    products.forEach(p => {
      if (p.name.includes('FBH') || p.name.includes('71500') || p.name.includes('LA10218')) {
        console.log('--- MATCH ---');
        console.log('Name:', p.name);
        console.log('Direct IP:', p.ip);
        console.log('Specs IP:', p.specifications?.ip);
        console.log('Specs IP Rating:', p.specifications?.ip_rating);
        console.log('Description:', p.description);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

checkAllProducts();
