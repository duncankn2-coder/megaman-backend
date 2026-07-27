import { getMongoClient } from './mongoClient';

function getModelPrefix(model: string): string {
  if (!model) return '';
  const base = model.replace(/v\d+/gi, '');
  const match = base.match(/^[a-zA-Z0-9]+/);
  return match ? match[0] : base.substring(0, 6);
}

function cleanModel(model: string): string {
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

export async function fetchSpecifications(modelNumber: string, mmCode?: string) {
  const client = await getMongoClient();
  try {
    const db = client.db('general_data');
    
    // 1. Try to find by MM Code first if provided
    if (mmCode) {
      const cleanMm = mmCode.trim().toUpperCase();
      // Search in light_source by mm_code (regex lookup, e.g. matching MM11760 in 711760/MM11760)
      const lightSourceCollection = db.collection('light_source');
      let specDoc = await lightSourceCollection.findOne({
        mm_code: { $regex: new RegExp(cleanMm, 'i') }
      });
      if (specDoc) {
        const { _id, __v, ...specs } = specDoc;
        if (specDoc.category1 !== undefined) {
          specs.categories = specDoc.category1;
        }
        return specs;
      }
      
      // Search in luminaire by Art_Nr or customer_model_no_new
      const luminaireCollection = db.collection('luminaire');
      specDoc = await luminaireCollection.findOne({
        $or: [
          { Art_Nr: cleanMm },
          { customer_model_no_new: cleanMm }
        ]
      });
      if (specDoc) {
        const { _id, __v, ...specs } = specDoc;
        if (specDoc.product_type !== undefined) {
          specs.categories = specDoc.product_type;
        }
        return specs;
      }
    }

    // 2. Try exact match on customer_model_no_new in luminaire collection
    const luminaireCollection = db.collection('luminaire');
    let specDoc = await luminaireCollection.findOne({ customer_model_no_new: modelNumber });

    // 3. Fallback: Try exact match in light_source collection
    if (!specDoc) {
      const lightSourceCollection = db.collection('light_source');
      specDoc = await lightSourceCollection.findOne({ new_erp_model_no: modelNumber });
      
      if (!specDoc) {
        specDoc = await lightSourceCollection.findOne({ yk_model_no: modelNumber });
      }
    }

    // 4. Fuzzy database-level fallback (using prefix + cleanModel matching)
    if (!specDoc) {
      const prefix = getModelPrefix(modelNumber);
      if (prefix) {
        const cleanTarget = cleanModel(modelNumber);
        
        // Search luminaire candidates
        const lumCandidates = await luminaireCollection.find({
          customer_model_no_new: { $regex: new RegExp('^' + prefix, 'i') }
        }).toArray();
        
        specDoc = lumCandidates.find(c => cleanModel(c.customer_model_no_new) === cleanTarget);
        
        // Search light_source candidates if still not found
        if (!specDoc) {
          const lightSourceCollection = db.collection('light_source');
          const lsCandidates = await lightSourceCollection.find({
            $or: [
              { new_erp_model_no: { $regex: new RegExp('^' + prefix, 'i') } },
              { yk_model_no: { $regex: new RegExp('^' + prefix, 'i') } }
            ]
          }).toArray();
          
          specDoc = lsCandidates.find(c => 
            cleanModel(c.new_erp_model_no) === cleanTarget || 
            cleanModel(c.yk_model_no) === cleanTarget
          );
        }
      }
    }

    if (!specDoc) {
      console.warn(`No specifications found in database for: ${modelNumber} (mmCode: ${mmCode})`);
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