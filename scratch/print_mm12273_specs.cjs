const { MongoClient } = require('mongodb');

async function inspectSpecs() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const sku = await db.collection('skus').findOne({ name: 'MM12273' });

    console.log('=== SKU MM12273 specifications ===');
    if (sku && sku.specifications) {
      for (const [k, v] of Object.entries(sku.specifications)) {
        if (k.toLowerCase().includes('ip') || String(v).includes('Bunker') || String(v).includes('IP')) {
          console.log(`KEY: "${k}" => VALUE:`, JSON.stringify(v));
        }
      }
    } else {
      console.log('No specifications on sku');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

inspectSpecs();
