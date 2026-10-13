const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('test');
  const genDb = client.db('general_data');

  const v1Product = await db.collection('products').findOne({ name: 'FBH72100v1-dp/ds/sc' });
  const v0Product = await db.collection('products').findOne({ name: 'FBH72100v0-dp/ds/sc' });
  const v0GenDoc = await genDb.collection('luminaire').findOne({ customer_model_no_new: 'FBH72100v0-dp/ds/sc' });
  const v1GenDoc = await genDb.collection('luminaire').findOne({ customer_model_no_new: 'FBH72100v1-dp/ds/sc' });

  console.log('v1Product ID:', v1Product?._id);
  console.log('v0Product ID:', v0Product?._id);
  console.log('v0GenDoc found:', !!v0GenDoc, v0GenDoc?.on_mode_power_w);
  console.log('v1GenDoc found:', !!v1GenDoc, v1GenDoc?.on_mode_power_w, v1GenDoc?.total_mains_efficacy_lmw);

  // 1. Update SKUs MM12872 and MM12992 to point to v1Product and have modelNumber FBH72100v1-dp/ds/sc
  // and update total_mains_efficacy_lmw to include 110 @3000K
  const skuRes = await db.collection('skus').updateMany(
    { name: { $in: ['MM12872', 'MM12992'] } },
    {
      $set: {
        modelNumber: 'FBH72100v1-dp/ds/sc',
        product: v1Product._id,
        'specifications.total_mains_efficacy_lmw': '110 @3000K 125 @4000K 110 @5700K',
        'specifications.customer_model_no_new': 'FBH72100v1-dp/ds/sc',
        'specifications.yk_model_no': 'FBH72100v1-dp/ds/sc'
      }
    }
  );
  console.log(`Updated ${skuRes.modifiedCount} SKUs.`);

  // 2. Fix v0Product specifications so it has the true v0 specs from v0GenDoc
  if (v0Product && v0GenDoc) {
    const { _id, __v, ...specs } = v0GenDoc;
    await db.collection('products').updateOne(
      { _id: v0Product._id },
      {
        $set: {
          specifications: specs,
          power: v0GenDoc.on_mode_power_w || '18/14/9'
        }
      }
    );
    console.log('Updated v0Product specifications to true v0 data.');
  }

  // 3. Make sure v1Product has the full v1 specs
  if (v1Product && v1GenDoc) {
    const { _id, __v, ...specs } = v1GenDoc;
    await db.collection('products').updateOne(
      { _id: v1Product._id },
      {
        $set: {
          specifications: specs,
          power: v1GenDoc.on_mode_power_w || '24/18/12'
        }
      }
    );
    console.log('Updated v1Product specifications to true v1 data.');
  }

  await client.close();
}

run().catch(console.error);
