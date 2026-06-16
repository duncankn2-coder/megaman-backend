const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const targetId = '6a30b6383ac749d36a3da79d';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const cols = await db.listCollections().toArray();
    
    for (const colInfo of cols) {
      const col = db.collection(colInfo.name);
      // Try string search
      let doc = await col.findOne({ _id: targetId });
      if (doc) {
        console.log(`Found in collection "${colInfo.name}" (as string):`, doc);
      }
      
      // Try ObjectId search
      try {
        doc = await col.findOne({ _id: new ObjectId(targetId) });
        if (doc) {
          console.log(`Found in collection "${colInfo.name}" (as ObjectId):`, doc);
        }
      } catch (e) {
        // Ignore invalid object id errors
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
