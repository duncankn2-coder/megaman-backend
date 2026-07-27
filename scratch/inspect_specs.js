import '../loadEnv.js';
import { getPayload } from 'payload';
import config from '../src/payload.config.js';

async function main() {
  const payload = await getPayload({
    config,
  });

  const product = await payload.findByID({
    collection: 'products',
    id: '6a6316edb73c1ca317563918',
  });

  console.log('=== Product 6a6316edb73c1ca317563918 Specs ===');
  console.log('on_mode_power_w:', product.specifications?.on_mode_power_w);
  console.log('cct_k:', product.specifications?.cct_k);
  console.log('colour_temperature:', product.specifications?.colour_temperature);
  console.log('colour_temp:', product.specifications?.colour_temp);
  console.log('cct:', product.specifications?.cct);
  console.log('power:', product.specifications?.power);
  console.log('wattage:', product.specifications?.wattage);
  console.log('Full specifications:', JSON.stringify(product.specifications, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
