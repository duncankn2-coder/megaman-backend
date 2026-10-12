const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testExtraction() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('general_data');
  const lumColl = db.collection('luminaire');
  const docs = await lumColl.find({}).toArray();

  let toUpdate = [];

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
        toUpdate.push({
          id: d._id,
          model,
          series: d.series_name,
          currentLength: d.length_mm,
          newLength: length,
          width,
          height
        });
      }
    }
  }

  console.log(`Products to update with renewed length_mm: ${toUpdate.length}`);
  console.log('\nList of all products to update:');
  toUpdate.forEach(u => {
    console.log(`- ${u.model} (${u.series}): current=${u.currentLength} -> new=${u.newLength} (W=${u.width}, H=${u.height})`);
  });

  await client.close();
}

testExtraction().catch(console.error);
