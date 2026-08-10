const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/';

async function unlockUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB.');
    const db = client.db();
    const result = await db.collection('users').updateMany(
      {},
      {
        $set: {
          loginAttempts: 0,
          lockUntil: null,
        },
      }
    );
    console.log(`Successfully unlocked user accounts! Modified count: ${result.modifiedCount}`);
  } catch (err) {
    console.error('Error unlocking users:', err);
  } finally {
    await client.close();
  }
}

unlockUsers();
