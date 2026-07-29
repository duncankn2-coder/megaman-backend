const { MongoClient } = require('mongodb');

async function findFbh() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('test');
    
    // Find products containing FBH71500
    const productsColl = db.collection('products');
    const fbhProds = await productsColl.find({
      name: { $regex: 'FBH71500', $options: 'i' }
    }).toArray();
    console.log(`Found ${fbhProds.length} products matching FBH71500:`);
    fbhProds.forEach(p => {
      console.log('--- PRODUCT:', p.name, '---');
      console.log('ip:', p.ip);
      console.log('specifications:', JSON.stringify(p.specifications, null, 2));
      console.log('description:', p.description);
    });

    // Find products containing LA10218
    const laProds = await productsColl.find({
      name: { $regex: 'LA10218', $options: 'i' }
    }).toArray();
    console.log(`Found ${laProds.length} products matching LA10218:`);
    laProds.forEach(p => {
      console.log('--- PRODUCT:', p.name, '---');
      console.log('ip:', p.ip);
      console.log('specifications:', JSON.stringify(p.specifications, null, 2));
      console.log('description:', p.description);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

findFbh();
