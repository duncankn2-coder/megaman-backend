const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    
    // List databases
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log('Databases:');
    for (const dbInfo of dbsList.databases) {
      console.log(`- ${dbInfo.name}`);
      const db = client.db(dbInfo.name);
      const cols = await db.listCollections().toArray();
      console.log('  Collections:', cols.map(c => c.name));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
