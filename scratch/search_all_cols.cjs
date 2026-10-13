const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const dbs = ['test', 'general_data'];
  for (const dbName of dbs) {
    const db = client.db(dbName);
    const cols = await db.listCollections().toArray();
    for (const c of cols) {
      const coll = db.collection(c.name);
      const count1 = await coll.countDocuments({
        $or: [
          { name: { $regex: /12872|12992/ } },
          { mm_code: { $regex: /12872|12992/ } },
          { Art_Nr: { $regex: /12872|12992/ } },
          { yk_product_code: { $regex: /12872|12992/ } },
          { customer_model_no_new: { $regex: /12872|12992/ } }
        ]
      });
      if (count1 > 0) {
        console.log(`Found in ${dbName}.${c.name}: ${count1} docs`);
        const docs = await coll.find({
          $or: [
            { name: { $regex: /12872|12992/ } },
            { mm_code: { $regex: /12872|12992/ } },
            { Art_Nr: { $regex: /12872|12992/ } },
            { yk_product_code: { $regex: /12872|12992/ } },
            { customer_model_no_new: { $regex: /12872|12992/ } }
          ]
        }).toArray();
        for (const d of docs) {
          console.log('Doc:', {
            _id: d._id,
            name: d.name,
            modelNumber: d.modelNumber,
            product: d.product,
            Art_Nr: d.Art_Nr,
            mm_code: d.mm_code,
            customer_model_no_new: d.customer_model_no_new,
          });
        }
      }
    }
  }
  await client.close();
}

run().catch(console.error);
