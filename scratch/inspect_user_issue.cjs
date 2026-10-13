const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('test');
  
  // 1. Inspect SKUs
  const skus = await db.collection('skus').find({
    name: { $in: ['MM12872', 'MM12992', 'MM12501'] }
  }).toArray();
  console.log('=== SKUS ===');
  for (const s of skus) {
    console.log({
      id: s._id.toString(),
      name: s.name,
      modelNumber: s.modelNumber,
      product: s.product,
      wattage: s.wattage,
      colourTemperature: s.colourTemperature,
      specifications: s.specifications,
    });
  }

  // 2. Inspect Products with FBH72100
  const prods = await db.collection('products').find({
    name: { $regex: /FBH72100/i }
  }).toArray();
  console.log('\n=== PRODUCTS ===');
  for (const p of prods) {
    console.log({
      id: p._id.toString(),
      name: p.name,
      power: p.power,
      colourTemperature: p.colourTemperature,
      families: p.families,
      specificationsEfficacy: p.specifications?.total_mains_efficacy_lmw || p.specifications?.efficacy,
      specificationsCct: p.specifications?.cct_k || p.specifications?.cct,
      specificationsLumen: p.specifications?.total_luminous_flux_lm || p.specifications?.luminous_flux,
      allSpecsKeys: Object.keys(p.specifications || {}),
    });
    console.log('Product specifications snippet:', JSON.stringify({
      total_mains_efficacy_lmw: p.specifications?.total_mains_efficacy_lmw,
      cct_k: p.specifications?.cct_k,
      total_luminous_flux_lm: p.specifications?.total_luminous_flux_lm,
      on_mode_power_w: p.specifications?.on_mode_power_w,
    }, null, 2));
  }

  // 3. Find which family these products belong to
  const famIds = prods.map(p => p.families).filter(Boolean);
  const fams = await db.collection('families').find({
    _id: { $in: famIds }
  }).toArray();
  console.log('\n=== FAMILIES ===');
  for (const f of fams) {
    console.log({
      id: f._id.toString(),
      name: f.name,
      slug: f.slug,
      productCount: f.products?.length,
    });
  }

  await client.close();
}

run().catch(console.error);
