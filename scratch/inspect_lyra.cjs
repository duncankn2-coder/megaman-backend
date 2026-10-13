const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('test');
  
  const lyra = await db.collection('families').findOne({ name: 'LYRA' });
  console.log('LYRA Family Products:', lyra.products);

  const prods = await db.collection('products').find({
    _id: { $in: lyra.products }
  }).toArray();

  console.log('\n--- LYRA Products ---');
  for (const p of prods) {
    console.log(`Product _id: ${p._id.toString()}, name: ${p.name}, power: ${p.power}, CCT: ${p.colourTemperature}`);
    console.log(`  specifications.total_mains_efficacy_lmw: "${p.specifications?.total_mains_efficacy_lmw}"`);
    console.log(`  specifications.cct_k: "${p.specifications?.cct_k}"`);
    console.log(`  specifications.total_luminous_flux_lm: "${p.specifications?.total_luminous_flux_lm}"`);
  }

  const skus = await db.collection('skus').find({
    product: { $in: lyra.products }
  }).toArray();

  console.log(`\n--- LYRA SKUs (${skus.length}) ---`);
  for (const s of skus) {
    console.log({
      id: s._id.toString(),
      name: s.name,
      modelNumber: s.modelNumber,
      productId: s.product?.toString(),
      wattage: s.wattage,
      colourTemperature: s.colourTemperature,
      efficacy: s.specifications?.total_mains_efficacy_lmw,
      cct_k: s.specifications?.cct_k,
    });
  }

  // Also check if there are other SKUs with MM12872, MM12992, MM12501 pointing to other products
  const specificSkus = await db.collection('skus').find({
    name: { $in: ['MM12872', 'MM12992', 'MM12501'] }
  }).toArray();
  console.log(`\n--- Specific SKUs check (${specificSkus.length}) ---`);
  for (const s of specificSkus) {
    const parent = await db.collection('products').findOne({ _id: s.product });
    console.log({
      skuName: s.name,
      skuModelNumber: s.modelNumber,
      parentId: s.product?.toString(),
      parentName: parent?.name,
      parentFamily: parent?.families?.toString()
    });
  }

  await client.close();
}

run().catch(console.error);
