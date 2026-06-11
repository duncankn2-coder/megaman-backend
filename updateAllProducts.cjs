const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://duncankwan:81nacnuD@cluster0.3jkccqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const generalDb = client.db('general_data');
    
    const productsCollection = db.collection('products');
    const luminaireCollection = generalDb.collection('luminaire');
    
    const products = await productsCollection.find({}).toArray();
    console.log(`Found ${products.length} products to check and update.`);
    
    let updatedCount = 0;
    
    for (const prod of products) {
      const modelNumber = prod.name;
      if (!modelNumber) continue;
      
      const luminaire = await luminaireCollection.findOne({ customer_model_no_new: modelNumber });
      if (luminaire) {
        const { _id, __v, ...specs } = luminaire;
        if (luminaire.product_type !== undefined) {
          specs.categories = luminaire.product_type;
        }
        
        await productsCollection.updateOne(
          { _id: prod._id },
          { $set: { specifications: specs } }
        );
        console.log(`Updated specifications for ${modelNumber} with MM Code: ${luminaire.yk_product_code}`);
        updatedCount++;
      } else {
        console.warn(`No luminaire found for model number: ${modelNumber}`);
      }
    }
    
    console.log(`Successfully updated specifications for ${updatedCount} products!`);
  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await client.close();
  }
}

run();
