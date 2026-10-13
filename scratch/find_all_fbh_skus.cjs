const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('test');
  
  const allSkus = await db.collection('skus').find({
    $or: [
      { modelNumber: { $regex: /FBH72100/i } },
      { 'specifications.customer_model_no_new': { $regex: /FBH72100/i } }
    ]
  }).toArray();

  console.log(`Found ${allSkus.length} SKUs for FBH72100:`);
  for (const s of allSkus) {
    console.log({
      id: s._id.toString(),
      name: s.name,
      modelNumber: s.modelNumber,
      product: s.product?.toString(),
      customer_model_no_new: s.specifications?.customer_model_no_new,
      power: s.wattage,
      cct: s.colourTemperature,
    });
  }

  await client.close();
}

run().catch(console.error);
