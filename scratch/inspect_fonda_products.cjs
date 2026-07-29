const { MongoClient, ObjectId } = require('mongodb');

async function inspectFonda() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const fam = await db.collection('families').findOne({ _id: new ObjectId('6a2a230f8bc4ed90e0014178') });
    
    if (!fam) return;

    const prods = await db.collection('products').find({ _id: { $in: fam.products.map(id => new ObjectId(id)) } }).toArray();

    for (const p of prods) {
      console.log('Product Name:', p.name);
      console.log('  p.ip:', p.ip);
      console.log('  p.specifications.ip:', p.specifications?.ip);
      console.log('  p.specifications.ip_rating:', p.specifications?.ip_rating);
      console.log('  p.description:', p.description);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

inspectFonda();
