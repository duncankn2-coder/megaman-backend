import { getMongoClient } from './mongoClient';

export async function fetchSpecifications(modelNumber: string) {
  const client = await getMongoClient();
  try {
    const db = client.db('general_data');
    
    // 1. Try to find in luminaire collection
    const luminaireCollection = db.collection('luminaire');
    let specDoc = await luminaireCollection.findOne({ customer_model_no_new: modelNumber });

    // 2. Fallback: Try to find in light_source collection
    if (!specDoc) {
      const lightSourceCollection = db.collection('light_source');
      specDoc = await lightSourceCollection.findOne({ new_erp_model_no: modelNumber });
      
      if (!specDoc) {
        // Try exact match on 'model_identifier' or other key model number fields if available
        specDoc = await lightSourceCollection.findOne({ yk_model_no: modelNumber });
      }
    }

    if (!specDoc) {
      console.warn(`No specifications found in luminaire or light_source for model number: ${modelNumber}`);
      return null;
    }

    // Extract all specifications, removing MongoDB internal fields
    const { _id, __v, ...specs } = specDoc;

    // Map product_type or Category/Subcategory to categories for backward compatibility
    if (specDoc.product_type !== undefined) {
      specs.categories = specDoc.product_type;
    } else if (specDoc.category1 !== undefined) {
      specs.categories = specDoc.category1;
    }

    return specs;
  } catch (error) {
    console.error('Error fetching specifications:', error);
    return null;
  }
}