import { getMongoClient } from '../src/utils/mongoClient';

async function run() {
  const client = await getMongoClient();
  try {
    const admin = client.db().admin();
    const dbList = await admin.listDatabases();
    console.log('Databases on this cluster:');
    for (const dbInfo of dbList.databases) {
      console.log(`- Database: ${dbInfo.name}`);
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
