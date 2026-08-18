import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sync() {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  const match = envContent.match(/DATABASE_URI=(.*)/);
  const uri = match ? match[1].trim() : '';
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');

  const { processXlsxToJson } = await import('../src/utils/xlsxToJsonConverter.ts');
  const buf = fs.readFileSync(path.join(__dirname, '..', '..', 'Fixture General data - Renzo Xchange.xlsx'));
  const specs = await processXlsxToJson(buf);
  console.log('Parsed specs count from Excel:', specs.length);

  const generalDb = client.db('general_data');
  const lumCol = generalDb.collection('luminaire');
  const testDb = client.db('test');
  const prodCol = testDb.collection('products');

  for (const s of specs) {
    const model = s.customer_model_no_new || s.yk_model_no;
    if (!model) continue;

    console.log('Updating DB for model:', model, 'CO:', s.energy_consumption_on_mode, 'CQ:', s.light_source_useful_luminous_flux_lm, 'CU:', s.light_source_on_mode_power_w, 'CV:', s.light_source_standby_power_w, 'CX/CY/CZ:', s.light_source_outer_dimensions_high_mm, s.light_source_outer_dimensions_width_mm, s.light_source_outer_dimensions_depth_mm, 'DI:', s.r9_cri_value);

    await lumCol.updateOne(
      { customer_model_no_new: model },
      { $set: s },
      { upsert: true }
    );

    await prodCol.updateOne(
      { name: model },
      { $set: { specifications: s } }
    );
  }

  console.log('Sync finished successfully!');
  await client.close();
}

sync().catch(console.error);
