const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    
    // Find products matching Fonda
    const products = await db.collection('products').find({ name: /FBH|BHD/i }).toArray();
    console.log(`Found ${products.length} products matching FBH/BHD:`);
    for (const p of products) {
      console.log(`- Product Name: ${p.name}`);
      console.log(`  - description: ${p.description}`);
      console.log(`  - colour: ${p.colour}`);
      console.log(`  - power: ${p.power}`);
      console.log(`  - colourTemperature: ${p.colourTemperature}`);
      console.log(`  - specifications exist? ${!!p.specifications}`);
      if (p.specifications) {
        console.log(`    - specifications keys: ${Object.keys(p.specifications).join(', ')}`);
        console.log(`    - specifications.cct_k: ${p.specifications.cct_k}`);
        console.log(`    - specifications.ip: ${p.specifications.ip}`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
