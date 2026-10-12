const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('general_data');
  const lumColl = db.collection('luminaire');
  const docs = await lumColl.find({}).toArray();

  const bySeries = {};
  for (const d of docs) {
    const s = d.series_name || 'Unknown';
    if (!bySeries[s]) bySeries[s] = [];
    bySeries[s].push({
      model: d.customer_model_no_new || d.yk_model_no,
      shape: d.shape,
      diameter: d.diameter_mm,
      length: d.length_mm,
      width: d.width_mm,
      height: d.height_mm,
      descPart: (d.description || '').split('/')[1] || (d.description || '').substring(0, 30)
    });
  }

  console.log('Summary by Series:');
  for (const [s, list] of Object.entries(bySeries)) {
    console.log(`\n=== Series: ${s} (${list.length} docs) ===`);
    list.slice(0, 3).forEach(item => {
      console.log(`  ${item.model}: Shape=${item.shape}, L=${item.length}, W=${item.width}, H=${item.height}, Dia=${item.diameter} | Desc: ${item.descPart}`);
    });
  }

  await client.close();
}

check().catch(console.error);
