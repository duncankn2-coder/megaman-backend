import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

function getModelPrefix(model) {
  if (!model) return '';
  // Strip version numbers (like v0, v1, v00, etc.) case-insensitively
  const base = model.replace(/v\d+/gi, '');
  const match = base.match(/^[a-zA-Z0-9]+/);
  return match ? match[0] : base.substring(0, 6);
}

function cleanModel(model) {
  if (!model) return '';
  return model
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/v\d+/g, '') // remove version numbers
    .replace(/v(?=\D|$)/g, '') // remove standalone v followed by non-digit or end of string
    .replace(/[-_]/g, '')
    .replace(/\//g, '')
    .replace(/dl/g, '')
    .replace(/ds/g, '')
    .replace(/sc/g, '');
}

async function testFuzzyMatch(modelNoVariant) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('general_data');
    
    console.log(`\nFuzzy matching for: "${modelNoVariant}"`);
    const prefix = getModelPrefix(modelNoVariant);
    console.log(`Extracted prefix: "${prefix}"`);
    
    // Query candidates
    const candidates = await db.collection('luminaire').find({
      customer_model_no_new: { $regex: new RegExp('^' + prefix, 'i') }
    }).toArray();
    
    console.log(`Found ${candidates.length} candidates in database.`);
    
    const targetClean = cleanModel(modelNoVariant);
    console.log(`Cleaned target: "${targetClean}"`);
    
    let bestMatch = null;
    for (const cand of candidates) {
      const candClean = cleanModel(cand.customer_model_no_new);
      console.log(`- Candidate: "${cand.customer_model_no_new}" -> Cleaned: "${candClean}"`);
      if (candClean === targetClean) {
        bestMatch = cand;
        break;
      }
    }
    
    if (bestMatch) {
      console.log(`SUCCESS! Matched to: "${bestMatch.customer_model_no_new}"`);
    } else {
      console.log('FAILED to match.');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

async function run() {
  await testFuzzyMatch('FCL76100v1-dl/sc+LA10217');
  await testFuzzyMatch('FCL76200v1-dl/ds/sc+LA10217');
}

run().catch(console.error);
