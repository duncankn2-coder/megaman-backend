const { MongoClient } = require('mongodb');

function cleanIp(ipStr) {
  if (!ipStr || ipStr === '—' || ipStr === 'null' || ipStr === 'undefined') return null;
  const str = String(ipStr).trim();
  if (str.length > 20 || str.toLowerCase().includes('shape:') || str.toLowerCase().includes('housing') || str.toLowerCase().includes('bunker') || str.toLowerCase().includes('ceiling light')) {
    return null;
  }
  const parts = str.split(/[\/,;]/).map(p => p.trim()).filter(Boolean);
  const normalized = parts.map(p => /^ip\d+/i.test(p) ? p.toUpperCase() : p);
  const unique = Array.from(new Set(normalized));
  if (unique.length === 0) return null;
  return unique.length === 1 ? unique[0] : unique.join('/');
}

function parseIpFromDesc(desc) {
  if (!desc) return null;
  const parts = desc.split('/').map(p => p.trim());
  const ipParts = [];
  for (const p of parts) {
    if (/^ip\d+/i.test(p)) {
      ipParts.push(p.toUpperCase());
    }
  }
  if (ipParts.length === 0) return null;
  const unique = Array.from(new Set(ipParts));
  return unique.length === 1 ? unique[0] : unique.join('/');
}

async function fixDbIp() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('test');
    const productsColl = db.collection('products');
    const skusColl = db.collection('skus');

    const products = await productsColl.find({}).toArray();
    console.log(`Processing ${products.length} products...`);

    let updatedProds = 0;
    for (const p of products) {
      let currentIp = p.specifications?.ip || p.ip;
      let newIp = cleanIp(currentIp);

      if (!newIp) {
        newIp = parseIpFromDesc(p.description || p.specifications?.description);
      }

      if (newIp && newIp !== currentIp) {
        console.log(`Fixing Product "${p.name}": "${currentIp}" -> "${newIp}"`);
        const updateData = {
          'specifications.ip': newIp,
          ip: newIp
        };
        await productsColl.updateOne({ _id: p._id }, { $set: updateData });
        updatedProds++;
      }
    }
    console.log(`Updated ${updatedProds} products in MongoDB.`);

    // Fix SKUs as well
    const skus = await skusColl.find({}).toArray();
    let updatedSkus = 0;
    for (const s of skus) {
      let currentIp = s.specifications?.ip || s.ip;
      let newIp = cleanIp(currentIp);

      if (!newIp) {
        newIp = parseIpFromDesc(s.description || s.specifications?.description);
      }

      if (newIp && newIp !== currentIp) {
        console.log(`Fixing SKU "${s.name}": "${currentIp}" -> "${newIp}"`);
        const updateData = {
          'specifications.ip': newIp,
          ip: newIp
        };
        await skusColl.updateOne({ _id: s._id }, { $set: updateData });
        updatedSkus++;
      }
    }
    console.log(`Updated ${updatedSkus} SKUs in MongoDB.`);

    // Also fix general_data.luminaire database
    const genDb = client.db('general_data');
    const lumColl = genDb.collection('luminaire');
    const luminaires = await lumColl.find({}).toArray();
    let updatedLums = 0;
    for (const l of luminaires) {
      let currentIp = l.ip;
      let newIp = cleanIp(currentIp);
      if (!newIp) {
        newIp = parseIpFromDesc(l.description);
      }
      if (newIp && newIp !== currentIp) {
        console.log(`Fixing general_data.luminaire "${l.customer_model_no_new || l.yk_model_no}": "${currentIp}" -> "${newIp}"`);
        await lumColl.updateOne({ _id: l._id }, { $set: { ip: newIp } });
        updatedLums++;
      }
    }
    console.log(`Updated ${updatedLums} documents in general_data.luminaire.`);

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

fixDbIp();
