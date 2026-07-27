import fs from 'fs';

async function run() {
  const jsonRaw = fs.readFileSync('C:/Users/duncankwan/Downloads/Fixture General data - Fonda Xchange_converted.json', 'utf8');
  const items = JSON.parse(jsonRaw);
  console.log(`Total items in Fonda XChange JSON: ${items.length}`);
  
  const models = items.map((item: any) => ({
    customer_model_no_new: item.customer_model_no_new,
    yk_model_no: item.yk_model_no,
    product_type: item.product_type,
    series_name: item.series_name,
    fitting_colour: item.fitting_colour,
    on_mode_power_w: item.on_mode_power_w,
    cct_k: item.cct_k
  }));

  console.log('First 15 items in JSON:');
  console.log(JSON.stringify(models.slice(0, 15), null, 2));

  // Count items with "+LA" in model number
  const plusLa = models.filter((m: any) => String(m.customer_model_no_new).includes('+'));
  console.log(`Items with '+' in customer_model_no_new: ${plusLa.length}`);
  if (plusLa.length > 0) {
    console.log(plusLa.slice(0, 5));
  }
}

run();
