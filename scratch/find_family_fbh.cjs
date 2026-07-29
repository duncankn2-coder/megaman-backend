const { MongoClient, ObjectId } = require('mongodb');

async function findFamily() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('test');
    const familiesColl = db.collection('families');
    const productsColl = db.collection('products');
    const skusColl = db.collection('skus');

    const familyId = '6a2a230f8bc4ed90e0014178';
    const fam = await familiesColl.findOne({ _id: new ObjectId(familyId) });
    console.log('--- FAMILY ---');
    console.log('Family Name:', fam ? fam.name : 'NOT FOUND');
    if (!fam) {
      // Find all families
      const allFams = await familiesColl.find({}).toArray();
      console.log('All family IDs:', allFams.map(f => ({ id: f._id.toString(), name: f.name })));
      return;
    }

    console.log('Family Description:', fam.description);
    console.log('Product IDs in Family:', fam.products);

    const prods = await productsColl.find({ _id: { $in: fam.products.map(id => new ObjectId(id)) } }).toArray();
    console.log(`--- PRODUCTS IN FAMILY (${prods.length}) ---`);
    for (const p of prods) {
      console.log('====================================');
      console.log('Product Name:', p.name);
      console.log('Product description:', p.description);
      console.log('Product IP:', p.ip);
      console.log('Product specifications.ip:', p.specifications?.ip);
      console.log('Product specifications keys:', Object.keys(p.specifications || {}));
      console.log('Product specifications FULL:', JSON.stringify(p.specifications, null, 2));

      // Find SKUs for this product
      const skus = await skusColl.find({ product: p._id }).toArray();
      console.log(`  SKUs (${skus.length}):`);
      for (const s of skus) {
        console.log('  SKU Name:', s.name, 'IP:', s.ip, 'Specs IP:', s.specifications?.ip, 'Specs:', JSON.stringify(s.specifications, null, 2));
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

findFamily();
