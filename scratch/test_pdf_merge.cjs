const { MongoClient, ObjectId } = require('mongodb');

async function testPdfMerge() {
  const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('test');
    const productsColl = db.collection('products');
    const familiesColl = db.collection('families');
    const mediaColl = db.collection('media');

    // Find products that have families or techDoc fields
    const prods = await productsColl.find({}).toArray();
    console.log(`Total products: ${prods.length}`);

    for (const p of prods) {
      if (p.families || p.techDocLightSource || p.techDocControlGear || p.techDocContainingProduct || p.datasheetPdf) {
        console.log('-----------------------------------');
        console.log('Product:', p._id.toString(), p.name);
        console.log('  techDocLightSource:', p.techDocLightSource);
        console.log('  techDocControlGear:', p.techDocControlGear);
        console.log('  techDocContainingProduct:', p.techDocContainingProduct);
        console.log('  datasheetPdf:', p.datasheetPdf);
        console.log('  families:', p.families);

        if (p.families) {
          const famId = typeof p.families === 'object' && p.families._id ? p.families._id : p.families;
          const fam = await familiesColl.findOne({ _id: new ObjectId(famId) });
          console.log('  Family:', fam ? fam.name : 'NOT FOUND', 'dismantleInstructionPdf:', fam ? fam.dismantleInstructionPdf : 'N/A');
          if (fam && fam.dismantleInstructionPdf) {
            const media = await mediaColl.findOne({ _id: new ObjectId(fam.dismantleInstructionPdf) });
            console.log('    DI Media doc:', media ? { id: media._id.toString(), filename: media.filename, url: media.url } : 'NOT FOUND');
          }
        }
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

testPdfMerge();
