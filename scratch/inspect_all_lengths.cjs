const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('general_data');
  const lumColl = db.collection('luminaire');
  const docs = await lumColl.find({}).toArray();

  console.log(`Total documents: ${docs.length}`);
  let canExtractFromDesc = 0;
  let cannotExtract = 0;

  for (const d of docs) {
    const desc = d.description || '';
    // Look for patterns like /N/Ax1500x60x60(mm)/ or /1500x60x60(mm)/ or /L1500xW60xH60/ or /600x600x32(mm)/
    const match = desc.match(/(?:N\/A|\d+)?\s*[xX*]\s*(\d{2,5})\s*[xX*]\s*(\d{2,5})\s*[xX*]\s*(\d{2,5})\s*\(?mm\)?/i)
               || desc.match(/(\d{2,5})\s*[xX*]\s*(\d{2,5})\s*[xX*]\s*(\d{2,5})\s*\(?mm\)?/i)
               || desc.match(/L(\d{2,5})\s*[xX*]\s*W(\d{2,5})/i);
    
    if (match) {
      canExtractFromDesc++;
    } else {
      cannotExtract++;
    }
  }

  console.log(`Documents with dimension pattern in description: ${canExtractFromDesc}`);
  console.log(`Documents without dimension pattern in description: ${cannotExtract}`);

  // Sample some descriptions
  console.log('\n--- Sample 10 Descriptions ---');
  docs.slice(0, 10).forEach(d => {
    console.log(`${d.customer_model_no_new || d.yk_model_no}: ${(d.description || '').substring(0, 70)}`);
  });

  await client.close();
}

check().catch(console.error);
