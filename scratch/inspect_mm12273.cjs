const { MongoClient } = require('mongodb');

async function inspectMM12273() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    
    // Find SKU MM12273
    const sku = await db.collection('skus').findOne({ name: 'MM12273' });
    console.log('=== SKU MM12273 ===');
    console.log(JSON.stringify(sku, null, 2));

    if (sku && sku.product) {
      const parent = await db.collection('products').findOne({ _id: sku.product });
      console.log('=== PARENT PRODUCT ===');
      console.log(JSON.stringify(parent, null, 2));
    } else {
      // Find products matching MM12273 or FBH71500
      const prods = await db.collection('products').find({ description: { $regex: 'MM12273|FBH71500', $options: 'i' } }).toArray();
      console.log('=== PRODUCTS MATCHING DESCRIPTION ===');
      console.log(JSON.stringify(prods, null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

inspectMM12273();
