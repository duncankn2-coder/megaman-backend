import { getMongoClient } from '../src/utils/mongoClient';

async function run() {
  const client = await getMongoClient();
  try {
    const db = client.db('test');
    
    // Find skus matching FBH or BHD in modelNumber
    const skus = await db.collection('skus').find({ modelNumber: /FBH|BHD/i }).toArray();
    console.log(`Found ${skus.length} SKUs matching FBH/BHD:`);
    for (const s of skus) {
      console.log(`- SKU Name: ${s.name}, modelNumber: ${s.modelNumber}, colour: ${s.colour}, wattage: ${s.wattage}, colourTemperature: ${s.colourTemperature}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
