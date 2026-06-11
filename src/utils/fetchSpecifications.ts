import { getMongoClient } from './mongoClient';

export async function fetchSpecifications(modelNumber: string) {
  const client = await getMongoClient();
  try {
    const db = client.db('general_data');
    const luminaireCollection = db.collection('luminaire');
    const luminaire = await luminaireCollection.findOne({ customer_model_no_new: modelNumber });

    if (!luminaire) {
      console.warn(`No luminaire found for model number: ${modelNumber}`);
      return null;
    }

    // Extract all specifications, removing MongoDB internal fields
    const { _id, __v, ...specs } = luminaire;

    // Map product_type to categories for backward compatibility
    if (luminaire.product_type !== undefined) {
      specs.categories = luminaire.product_type;
    }

    return specs;
  } catch (error) {
    console.error('Error fetching specifications:', error);
    return null;
  }
}