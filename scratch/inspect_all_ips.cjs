const { MongoClient } = require('mongodb');

async function inspectIps() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const products = await db.collection('products').find({}).toArray();

    const ipValues = new Set();
    const modelIps = [];

    products.forEach(p => {
      const rawIp = p.ip || p.specifications?.ip || p.specifications?.ip_rating;
      if (rawIp) ipValues.add(rawIp);
      modelIps.push({ name: p.name, rawIp });
    });

    console.log('--- ALL UNIQUE IP VALUES IN DB ---');
    console.log(Array.from(ipValues));

    console.log('\n--- SAMPLE PRODUCTS AND THEIR IP VALUES ---');
    modelIps.slice(0, 30).forEach(m => console.log(`${m.name}: "${m.rawIp}"`));

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

inspectIps();
