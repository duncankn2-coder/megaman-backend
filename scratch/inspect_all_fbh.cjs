const fs = require('fs');

const raw = fs.readFileSync('fixture_data.json', 'utf8');
const data = JSON.parse(raw);

const matches = data.filter(item => JSON.stringify(item).includes('FBH71500'));

console.log(`Found ${matches.length} matches for FBH71500 in fixture_data.json:`);
matches.forEach((m, idx) => {
  console.log(`--- Match ${idx+1} ---`);
  console.log('customer_model_no_new:', m.customer_model_no_new);
  console.log('ip:', m.ip);
  console.log('description:', m.description);
  console.log('protection_class:', m.protection_class);
});
