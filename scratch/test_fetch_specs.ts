import { fetchSpecifications } from '../src/utils/fetchSpecifications';

async function run() {
  const model = 'FBH71500v0-ds/sc';
  console.log(`Calling fetchSpecifications for model: ${model}`);
  const result = await fetchSpecifications(model);
  console.log('Result:', result);
}

run();
