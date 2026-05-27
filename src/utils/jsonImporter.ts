import { Payload } from 'payload';
import { getMongoClient } from './mongoClient';

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  warnings: string[];
  logs: string[];
}

export async function processJsonImport(
  payload: Payload,
  jsonData: any
): Promise<ImportResult> {
  const warnings: string[] = [];
  const logs: string[] = [];
  let createdCount = 0;
  let updatedCount = 0;

  logs.push('Starting JSON import process...');

  let items: any[] = [];
  if (Array.isArray(jsonData)) {
    items = jsonData;
  } else if (jsonData && typeof jsonData === 'object') {
    items = [jsonData];
  } else {
    throw new Error('Invalid JSON format. Expected an array of products or a single product object.');
  }

  logs.push(`Found ${items.length} product entries in uploaded JSON.`);

  if (items.length === 0) {
    return { success: true, created: 0, updated: 0, warnings: ['JSON array is empty.'], logs };
  }

  // Connect to MongoDB to upsert general_data.luminaire
  let luminaireCollection: any = null;
  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db('general_data');
    luminaireCollection = db.collection('luminaire');
    logs.push('Successfully connected to general_data MongoDB database.');
  } catch (err: any) {
    warnings.push(`Could not connect to MongoDB for syncing specifications: ${err.message}. Products will be imported, but direct specs sync might be skipped.`);
  }

  // Find or create default placeholder image in Media collection
  let placeholderImageId: string | null = null;
  try {
    const existingPlaceholder = await payload.find({
      collection: 'media',
      where: {
        alt: { equals: 'Placeholder Image' },
      },
      limit: 1,
    });

    if (existingPlaceholder.docs.length > 0) {
      placeholderImageId = existingPlaceholder.docs[0].id as string;
      logs.push(`Found existing default placeholder image (ID: ${placeholderImageId}).`);
    } else {
      // Create a 1x1 pixel transparent PNG placeholder
      const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const buffer = Buffer.from(base64Png, 'base64');
      
      const newMedia = await payload.create({
        collection: 'media',
        data: {
          alt: 'Placeholder Image',
          type: 'image',
        },
        file: {
          data: buffer,
          name: 'placeholder.png',
          size: buffer.length,
          mimetype: 'image/png',
        },
      });
      placeholderImageId = newMedia.id as string;
      logs.push(`Created a new default placeholder media document (ID: ${placeholderImageId}).`);
    }
  } catch (e: any) {
    warnings.push(`Could not check or create placeholder media: ${e.message}`);
  }

  // Process each product item in the JSON
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemIndex = i + 1;

    const modelNumber = item.customer_model_no_new || item.yk_model_no;
    if (!modelNumber || String(modelNumber).trim() === 'N/A' || String(modelNumber).trim() === '') {
      warnings.push(`Item ${itemIndex}: Skipped because both "customer_model_no_new" and "yk_model_no" are missing or invalid.`);
      continue;
    }

    logs.push(`Processing item ${itemIndex}/${items.length}: Model "${modelNumber}"...`);

    // 1. Sync specifications in MongoDB
    if (luminaireCollection) {
      try {
        const cleanItem = { ...item };
        delete cleanItem._id; // Remove _id if it was present
        
        await luminaireCollection.updateOne(
          { customer_model_no_new: modelNumber },
          { $set: cleanItem },
          { upsert: true }
        );
        logs.push(`- Upserted specifications into MongoDB 'luminaire' collection.`);
      } catch (err: any) {
        warnings.push(`Item ${itemIndex} (${modelNumber}): Failed to sync spec in MongoDB. Error: ${err.message}`);
      }
    }

    // 2. Resolve Categories (from product_type)
    const categoryName = item.product_type || 'Uncategorized';
    const finalCategoryIds: string[] = [];
    const catNames = categoryName.split(',').map((s: string) => s.trim()).filter(Boolean);
    
    for (const cName of catNames) {
      try {
        const catQuery = await payload.find({
          collection: 'categories',
          where: {
            name: { equals: cName },
          },
          limit: 1,
        });

        if (catQuery.docs.length > 0) {
          finalCategoryIds.push(catQuery.docs[0].id as string);
        } else {
          logs.push(`- Category "${cName}" not found. Creating dynamically...`);
          const newCat = await payload.create({
            collection: 'categories',
            data: {
              name: cName,
            },
          });
          finalCategoryIds.push(newCat.id as string);
          logs.push(`  Successfully created category "${cName}".`);
        }
      } catch (err: any) {
        warnings.push(`Item ${itemIndex} (${modelNumber}): Error resolving category "${cName}": ${err.message}`);
      }
    }

    if (finalCategoryIds.length === 0) {
      warnings.push(`Item ${itemIndex} (${modelNumber}): Skipped because no valid Category could be assigned or created.`);
      continue;
    }

    // 3. Resolve Family (from series_name)
    let finalFamilyId: string | null = null;
    const familyName = item.series_name;
    if (familyName && String(familyName).trim() !== 'N/A' && String(familyName).trim() !== '') {
      try {
        const famQuery = await payload.find({
          collection: 'families',
          where: {
            name: { equals: familyName },
          },
          limit: 1,
        });

        if (famQuery.docs.length > 0) {
          finalFamilyId = famQuery.docs[0].id as string;
          
          // Merge categories on existing family
          const existingCategories = (famQuery.docs[0].categories || []) as (string | any)[];
          const existingCatIds = existingCategories.map(c => typeof c === 'object' ? c.id : c);
          const unionCatIds = Array.from(new Set([...existingCatIds, ...finalCategoryIds]));
          
          await payload.update({
            collection: 'families',
            id: finalFamilyId,
            data: {
              categories: unionCatIds,
            },
          });
        } else {
          logs.push(`- Family "${familyName}" not found. Creating dynamically...`);
          const newFam = await payload.create({
            collection: 'families',
            data: {
              name: familyName,
              description: `A collection of premium Megaman ${familyName} products.`,
              media: placeholderImageId ? [placeholderImageId] : [],
              categories: finalCategoryIds,
            },
          });
          finalFamilyId = newFam.id as string;
          logs.push(`  Successfully created family "${familyName}".`);
        }
      } catch (err: any) {
        warnings.push(`Item ${itemIndex} (${modelNumber}): Error resolving family "${familyName}": ${err.message}`);
      }
    }

    // 4. Resolve Product Image
    let imageId = placeholderImageId;
    try {
      // Find a media record that matches modelNumber
      const mediaQuery = await payload.find({
        collection: 'media',
        where: {
          filename: {
            // Check if filename contains modelNumber (case-insensitive)
            like: modelNumber
          }
        },
        limit: 1,
      });

      if (mediaQuery.docs.length > 0) {
        imageId = mediaQuery.docs[0].id as string;
        logs.push(`- Found matching media record for "${modelNumber}" (ID: ${imageId}).`);
      } else {
        // Double check by filename fuzzy search (sometimes filename uses spaces instead of dashes)
        const spaceModel = modelNumber.replace(/-/g, ' ');
        const mediaQuerySpace = await payload.find({
          collection: 'media',
          where: {
            filename: {
              like: spaceModel
            }
          },
          limit: 1,
        });
        
        if (mediaQuerySpace.docs.length > 0) {
          imageId = mediaQuerySpace.docs[0].id as string;
          logs.push(`- Found matching media record (spaced) for "${modelNumber}" (ID: ${imageId}).`);
        } else {
          logs.push(`- No custom media record found for "${modelNumber}". Falling back to default placeholder image.`);
        }
      }
    } catch (err: any) {
      warnings.push(`Item ${itemIndex} (${modelNumber}): Error searching media collection: ${err.message}`);
    }

    // 5. Create or Update Product in PayloadCMS
    try {
      const existingProducts = await payload.find({
        collection: 'products',
        where: {
          name: { equals: modelNumber },
        },
        limit: 1,
      });

      const productData: any = {
        name: modelNumber,
        description: item.description || '',
        colour: item.fitting_colour && item.fitting_colour !== 'N/A' ? item.fitting_colour : undefined,
        power: item.on_mode_power_w && item.on_mode_power_w !== 'N/A' ? String(item.on_mode_power_w) : undefined,
        colourTemperature: item.cct_k && item.cct_k !== 'N/A' ? String(item.cct_k) : undefined,
      };

      if (imageId) {
        productData.images = imageId;
      }
      if (finalFamilyId) {
        productData.families = finalFamilyId;
      }

      if (existingProducts.docs.length > 0) {
        const prevDoc = existingProducts.docs[0];
        logs.push(`- Product SKU "${modelNumber}" already exists in CMS. Updating details...`);
        
        await payload.update({
          collection: 'products',
          id: prevDoc.id,
          data: productData,
        });
        
        updatedCount++;
        logs.push(`  Successfully updated Product SKU "${modelNumber}".`);
      } else {
        logs.push(`- Product SKU "${modelNumber}" does not exist in CMS. Creating...`);
        
        await payload.create({
          collection: 'products',
          data: productData,
        });
        
        createdCount++;
        logs.push(`  Successfully created Product SKU "${modelNumber}".`);
      }
    } catch (err: any) {
      warnings.push(`Item ${itemIndex} (${modelNumber}): Failed to create/update Product. Error: ${err.message}`);
    }
  }

  logs.push(`JSON import completed: ${createdCount} created, ${updatedCount} updated.`);
  return {
    success: true,
    created: createdCount,
    updated: updatedCount,
    warnings,
    logs,
  };
}
