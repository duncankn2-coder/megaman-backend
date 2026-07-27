import '../loadEnv.js';
import { getPayload } from 'payload';
import config from '../src/payload.config.js';

async function run() {
  const payload = await getPayload({ config });
  
  console.log('\n--- Inspecting Specific Product ---');
  try {
    const prod = await payload.findByID({
      collection: 'products',
      id: '6a6316edb73c1ca317563918'
    });
    console.log(JSON.stringify(prod, null, 2));
  } catch (err) {
    console.error('Error finding product:', err);
  }
  
  process.exit(0);
}

run().catch(console.error);
