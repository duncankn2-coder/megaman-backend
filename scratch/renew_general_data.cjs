const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function renewAllGeneralData() {
  const client = new MongoClient(uri);
  await client.connect();

  const generalDb = client.db('general_data');
  const testDb = client.db('test');
  const lumColl = generalDb.collection('luminaire');
  const prodColl = testDb.collection('products');
  const skusColl = testDb.collection('skus');

  const docs = await lumColl.find({}).toArray();
  console.log(`Analyzing ${docs.length} documents in general_data.luminaire...`);

  let updatedLumCount = 0;
  let updatedProdCount = 0;
  let updatedSkuCount = 0;

  const renewedList = [];

  for (const d of docs) {
    const model = d.customer_model_no_new || d.yk_model_no;
    const desc = d.description || '';

    // Matches /N/Ax1500x60x60(mm)/ or /x600x64x65(mm)/ or /1500x60x60(mm)/
    let m = desc.match(/(?:N\/A)?\s*[xX*]\s*(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)\s*\(?mm\)?/i);
    if (!m) {
      m = desc.match(/[\/,\s](\d{3,4})\s*[xX*]\s*(\d{2,4})\s*[xX*]\s*(\d{2,4})\s*\(?mm\)?/i);
    }

    if (m) {
      const length = Number(m[1]);
      const width = Number(m[2]);
      const height = Number(m[3]);

      if (d.length_mm !== length) {
        // 1. Update general_data.luminaire
        const lumRes = await lumColl.updateOne(
          { _id: d._id },
          { $set: { length_mm: length } }
        );
        if (lumRes.modifiedCount > 0) updatedLumCount++;

        // 2. Update test.products (matching by model name or _id)
        const prodRes = await prodColl.updateMany(
          {
            $or: [
              { name: model },
              { 'specifications.customer_model_no_new': model },
              { 'specifications.yk_model_no': model }
            ]
          },
          { $set: { 'specifications.length_mm': length } }
        );
        updatedProdCount += prodRes.modifiedCount;

        // 3. Update test.skus (matching by modelNumber or embedded specs)
        const skuRes = await skusColl.updateMany(
          {
            $or: [
              { modelNumber: model },
              { 'specifications.customer_model_no_new': model },
              { 'specifications.yk_model_no': model }
            ]
          },
          { $set: { 'specifications.length_mm': length } }
        );
        updatedSkuCount += skuRes.modifiedCount;

        renewedList.push({
          model,
          series: d.series_name,
          length,
          width,
          height
        });
      }
    }
  }

  console.log('\n================ RENEWAL COMPLETE ================');
  console.log(`general_data.luminaire updated: ${updatedLumCount} documents`);
  console.log(`test.products updated:          ${updatedProdCount} documents`);
  console.log(`test.skus updated:              ${updatedSkuCount} documents`);
  console.log(`Total models renewed:           ${renewedList.length}`);

  console.log('\n--- Renewed Products by Family ---');
  const byFam = {};
  renewedList.forEach(item => {
    const s = item.series || 'Uncategorized';
    if (!byFam[s]) byFam[s] = [];
    byFam[s].push(`${item.model} (${item.length}mm)`);
  });

  for (const [fam, items] of Object.entries(byFam)) {
    console.log(`\n• ${fam} (${items.length}):`);
    console.log(`  ${items.join(', ')}`);
  }

  await client.close();
}

renewAllGeneralData().catch(console.error);
