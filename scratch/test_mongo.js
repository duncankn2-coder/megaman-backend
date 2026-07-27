import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('general_data');
    
    // Find a luminaire with non-null Art_Nr or something containing MM
    const lum = await db.collection('luminaire').findOne({ Art_Nr: { $ne: null } });
    console.log('--- Luminaire with non-null Art_Nr ---');
    console.log(JSON.stringify(lum, null, 2));

    const lum2 = await db.collection('luminaire').findOne({
      $or: [
        { customer_model_no_new: /MM/i },
        { yk_model_no: /MM/i },
        { description: /MM/i }
      ]
    });
    console.log('--- Luminaire containing "MM" ---');
    console.log(JSON.stringify(lum2, null, 2));

    // Count of total luminaires with non-null Art_Nr
    const countArtNr = await db.collection('luminaire').countDocuments({ Art_Nr: { $ne: null } });
    console.log(`Total luminaires with Art_Nr: ${countArtNr}`);

  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run().catch(console.error);
