const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const globalsCollection = db.collection('globals');
    
    const homepage = await globalsCollection.findOne({ slug: 'home-page' });
    if (!homepage) {
      console.log('No home-page global found.');
      return;
    }

    console.log('Current home-page keys:', Object.keys(homepage));

    const existingLayout = homepage.layout || (homepage.international && homepage.international.layout) || [];
    console.log(`Existing layout has ${existingLayout.length} blocks.`);

    const updateDoc = {
      $set: {
        international: homepage.international && homepage.international.layout?.length > 0 
          ? homepage.international 
          : { layout: existingLayout },
        hk: homepage.hk && homepage.hk.layout?.length > 0 
          ? homepage.hk 
          : { layout: existingLayout },
        uk: homepage.uk && homepage.uk.layout?.length > 0 
          ? homepage.uk 
          : { layout: existingLayout },
        updatedAt: new Date()
      }
    };

    const res = await globalsCollection.updateOne({ slug: 'home-page' }, updateDoc);
    console.log('Update result:', res);

    const updated = await globalsCollection.findOne({ slug: 'home-page' });
    console.log('Updated doc has international blocks:', updated.international?.layout?.length);
    console.log('Updated doc has hk blocks:', updated.hk?.layout?.length);
    console.log('Updated doc has uk blocks:', updated.uk?.layout?.length);
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.close();
  }
}

run();
