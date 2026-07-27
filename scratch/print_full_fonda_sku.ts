import { getMongoClient } from '../src/utils/mongoClient';

async function run() {
  const client = await getMongoClient();
  try {
    const db = client.db('test');
    const s = await db.collection('skus').findOne({ name: 'MM12268' });
    console.log('Full SKU document from MongoDB:');
    console.log(JSON.stringify(s, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
