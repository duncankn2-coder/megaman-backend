const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function fix() {
  const client = new MongoClient(uri);
  await client.connect();

  const angleMap = {
    2436: '24/36',
    '2436': '24/36',
    2445: '24/45',
    '2445': '24/45',
    2545: '25/45',
    '2545': '25/45',
  };

  // 1. general_data.luminaire
  const lumColl = client.db('general_data').collection('luminaire');
  const lumDocs = await lumColl.find({
    beam_angle: { $gt: 360 }
  }).toArray();
  console.log(`[general_data.luminaire] Found ${lumDocs.length} docs with beam_angle > 360`);

  for (const doc of lumDocs) {
    const orig = doc.beam_angle;
    const fixed = angleMap[orig];
    if (fixed) {
      await lumColl.updateOne({ _id: doc._id }, { $set: { beam_angle: fixed } });
      console.log(`Updated luminaire ${doc._id} (${doc.customer_model_no_new || doc.yk_model_no}): ${orig} -> ${fixed}`);
    } else {
      console.log(`Warning: No mapping for luminaire ${doc._id} with beam_angle: ${orig}`);
    }
  }

  // 2. test.products
  const prodColl = client.db('test').collection('products');
  const prodDocs = await prodColl.find({
    $or: [
      { 'general_data.beam_angle': { $in: [2436, '2436', 2445, '2445', 2545, '2545'] } },
      { beam_angle: { $in: [2436, '2436', 2445, '2445', 2545, '2545'] } }
    ]
  }).toArray();
  console.log(`[test.products] Found ${prodDocs.length} products`);

  for (const doc of prodDocs) {
    const updates = {};
    if (doc.general_data?.beam_angle && angleMap[doc.general_data.beam_angle]) {
      updates['general_data.beam_angle'] = angleMap[doc.general_data.beam_angle];
    }
    if (doc.beam_angle && angleMap[doc.beam_angle]) {
      updates.beam_angle = angleMap[doc.beam_angle];
    }
    if (Object.keys(updates).length > 0) {
      await prodColl.updateOne({ _id: doc._id }, { $set: updates });
      console.log(`Updated product ${doc._id} (${doc.model_no || doc.title}):`, updates);
    }
  }

  // 3. test.skus
  const skuColl = client.db('test').collection('skus');
  const skuDocs = await skuColl.find({
    $or: [
      { 'general_data.beam_angle': { $in: [2436, '2436', 2445, '2445', 2545, '2545'] } },
      { beam_angle: { $in: [2436, '2436', 2445, '2445', 2545, '2545'] } },
      { 'specifications.beam_angle': { $in: [2436, '2436', 2445, '2445', 2545, '2545'] } }
    ]
  }).toArray();
  console.log(`[test.skus] Found ${skuDocs.length} skus`);

  for (const doc of skuDocs) {
    const updates = {};
    if (doc.general_data?.beam_angle && angleMap[doc.general_data.beam_angle]) {
      updates['general_data.beam_angle'] = angleMap[doc.general_data.beam_angle];
    }
    if (doc.beam_angle && angleMap[doc.beam_angle]) {
      updates.beam_angle = angleMap[doc.beam_angle];
    }
    if (doc.specifications?.beam_angle && angleMap[doc.specifications.beam_angle]) {
      updates['specifications.beam_angle'] = angleMap[doc.specifications.beam_angle];
    }
    if (Object.keys(updates).length > 0) {
      await skuColl.updateOne({ _id: doc._id }, { $set: updates });
      console.log(`Updated sku ${doc._id} (${doc.model_no || doc.sku_code}):`, updates);
    }
  }

  // 4. Verify any remaining in general_data.luminaire
  const remaining = await lumColl.countDocuments({ beam_angle: { $gt: 360 } });
  console.log(`[general_data.luminaire] Remaining with beam_angle > 360: ${remaining}`);

  await client.close();
}

fix().catch(console.error);
