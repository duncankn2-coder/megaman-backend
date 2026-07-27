import { getMongoClient } from '../src/utils/mongoClient';

async function run() {
  const client = await getMongoClient();
  try {
    const db = client.db('test');
    const p = await db.collection('products').findOne({ name: 'FBH71500v0-ds/sc' });
    console.log('Full product document from MongoDB:');
    console.log(JSON.stringify(p, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
