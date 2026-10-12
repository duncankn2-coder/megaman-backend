const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('general_data');
  const lumColl = db.collection('luminaire');
  const docs = await lumColl.find({}).toArray();

  const excelFiles = [
    'e:/megaman-web/Fixture General data - Renzo Xchange.xlsx',
    'e:/megaman-web/megaman-backend/Fixture General data - Berto backlit.xlsx',
    'e:/megaman-web/megaman-backend/Fixture General data - Hagon 2.xlsx',
    'c:/Users/duncankwan/Downloads/Fixture General data - Keto Slim.xlsx',
    'c:/Users/duncankwan/Downloads/Fixture General data - Keto Slim (1).xlsx',
  ];

  const excelModels = new Map(); // model -> { file, length, width, height, diameter }

  for (const f of excelFiles) {
    if (!fs.existsSync(f)) continue;
    const wb = xlsx.readFile(f);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    for (let r = 4; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      // Col 8: Customer Model No New, Col 10: YK Model No, Col 7: Old Model No
      const model = String(row[8] || row[10] || '').trim();
      if (!model || model === 'N/A') continue;
      excelModels.set(model, {
        file: path.basename(f),
        length: row[45],
        width: row[46],
        height: row[47],
        diameter: row[44]
      });
    }
  }

  console.log(`Unique models found in available Excel files: ${excelModels.size}`);

  let matchedInDb = 0;
  let hasLengthInExcel = 0;
  for (const d of docs) {
    const m = d.customer_model_no_new || d.yk_model_no;
    if (excelModels.has(m)) {
      matchedInDb++;
      const ex = excelModels.get(m);
      if (ex.length && ex.length !== 'N/A') {
        hasLengthInExcel++;
      }
    }
  }

  console.log(`Db documents matching available Excel files: ${matchedInDb} / ${docs.length}`);
  console.log(`Db documents where Excel has non-N/A length: ${hasLengthInExcel}`);

  await client.close();
}

check().catch(console.error);
