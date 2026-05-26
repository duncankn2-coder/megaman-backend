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
        const specs = {
          yk_product_code: luminaire.yk_product_code,
          model_identifier: luminaire.model_identifier,
          customer_model_no_old: luminaire.customer_model_no_old,
          rated_voltage_v: luminaire.rated_voltage_v,
          frequency_hz: luminaire.frequency_hz,
          input_current_ma: luminaire.input_current_ma,
          on_mode_power_w: luminaire.on_mode_power_w,
          total_luminous_flux_lm: luminaire.total_luminous_flux_lm,
          useful_luminous_flux_lm: luminaire.useful_luminous_flux_lm,
          total_mains_efficacy_lmw: luminaire.total_mains_efficacy_lmw,
          cct_k: luminaire.cct_k,
          ra: luminaire.ra,
          colour_consistency: luminaire.colour_consistency,
          maximum_intensity_cd: luminaire.maximum_intensity_cd,
          beam_angle: luminaire.beam_angle,
          dimmable: luminaire.dimmable,
          dimming_type: luminaire.dimming_type,
          power_factor: luminaire.power_factor,
          flickering: luminaire.flickering,
          norminal_life_h: luminaire.norminal_life_h,
          temperature_of_ambient: luminaire.temperature_of_ambient,
          operating_temperature: luminaire.operating_temperature,
          diameter_mm: luminaire.diameter_mm,
          height_mm: luminaire.height_mm,
          recessed_cut_out_mm: luminaire.recessed_cut_out_mm,
          net_weight_g: luminaire.net_weight_g,
          shape: luminaire.shape,
          fitting_colour: luminaire.fitting_colour,
          housing_material: luminaire.housing_material,
          diffuser_material: luminaire.diffuser_material,
          protection_class: luminaire.protection_class,
          ip: luminaire.ip,
          mounting: luminaire.mounting,
        };
        
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
