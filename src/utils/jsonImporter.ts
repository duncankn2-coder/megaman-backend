import { Payload } from 'payload';
import { ObjectId } from 'mongodb';
import { getMongoClient } from './mongoClient';

function toObjectId(id: any): ObjectId {
  if (id instanceof ObjectId) return id;
  const str = String(typeof id === 'object' && id !== null ? (id._id || id.id || id) : id).trim();
  return ObjectId.isValid(str) ? new ObjectId(str) : (id as any);
}

function cleanUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result;
}

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

  const mongoClient = await getMongoClient();
  const payloadDb = (payload.db as any)?.connection?.db || mongoClient.db();
  const productsCollection = payloadDb.collection('products');
  const familiesCollection = payloadDb.collection('families');
  const categoriesCollection = payloadDb.collection('categories');
  const mediaCollection = payloadDb.collection('media');

  const categoryCache = new Map<string, string>();
  const familyCache = new Map<string, any>();
  const existingProductsMap = new Map<string, any>();
  const mediaList: any[] = [];

  try {
    const [existingCats, existingFams, existingProds, allMedia] = await Promise.all([
      categoriesCollection.find({}, { projection: { _id: 1, name: 1 } }).toArray(),
      familiesCollection.find({}, { projection: { _id: 1, name: 1, categories: 1 } }).toArray(),
      productsCollection.find({}, { projection: { _id: 1, name: 1, images: 1 } }).toArray(),
      mediaCollection.find({}, { projection: { _id: 1, filename: 1 } }).toArray(),
    ]);
    existingCats.forEach((c: any) => {
      if (c.name) categoryCache.set(String(c.name).toLowerCase().trim(), String(c._id));
    });
    existingFams.forEach((f: any) => {
      if (f.name) familyCache.set(String(f.name).toLowerCase().trim(), { ...f, id: String(f._id) });
    });
    existingProds.forEach((p: any) => {
      if (p.name) existingProductsMap.set(String(p.name).toLowerCase().trim(), { ...p, id: String(p._id) });
    });
    allMedia.forEach((m: any) => {
      if (m.filename) mediaList.push({ id: String(m._id), filename: String(m.filename).toLowerCase() });
    });
  } catch (e: any) {
    warnings.push(`Pre-fetch cache warning: ${e.message}`);
  }

  const lumBulkOps: any[] = [];
  const productBulkOps: any[] = [];
  const touchedFamilyIds = new Set<string>();
  const accessoryProductIds = new Set<string>();
  const now = new Date();
  const seenModels = new Set<string>();

  const isAccessoryProductType = (val: any): boolean => {
    if (!val) return false;
    const clean = String(val).trim().toLowerCase();
    return clean === 'accessories' || clean === 'accessory' || /^accessor(y|ies)\b/i.test(clean);
  };

  // Process each product item in the JSON
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemIndex = i + 1;

    const modelNumber = item.customer_model_no_new || item.yk_model_no;
    if (!modelNumber || String(modelNumber).trim() === 'N/A' || String(modelNumber).trim() === '') {
      warnings.push(`Item ${itemIndex}: Skipped because both "customer_model_no_new" and "yk_model_no" are missing or invalid.`);
      continue;
    }

    const modelKey = String(modelNumber).toLowerCase().trim();
    if (seenModels.has(modelKey)) continue;
    seenModels.add(modelKey);

    logs.push(`Processing item ${itemIndex}/${items.length}: Model "${modelNumber}"...`);

    // 1. Sync specifications in MongoDB
    if (luminaireCollection) {
      const cleanItem = { ...item };
      delete cleanItem._id;
      lumBulkOps.push({
        updateOne: {
          filter: { customer_model_no_new: modelNumber },
          update: { $set: cleanItem },
          upsert: true,
        },
      });
    }

    // 2. Resolve Categories (from product_type)
    const categoryName = item.product_type || 'Uncategorized';
    const finalCategoryIds: string[] = [];
    const catNames = categoryName.split(',').map((s: string) => s.trim()).filter(Boolean);

    for (const cName of catNames) {
      const catKey = cName.toLowerCase().trim();
      let catId = categoryCache.get(catKey);
      if (!catId) {
        const newCatId = new ObjectId();
        await categoriesCollection.insertOne({
          _id: newCatId,
          name: cName,
          createdAt: now,
          updatedAt: now,
          __v: 0,
        });
        catId = String(newCatId);
        categoryCache.set(catKey, catId);
      }
      finalCategoryIds.push(catId);
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
        const famKey = String(familyName).toLowerCase().trim();
        const famDoc = familyCache.get(famKey);

        if (famDoc) {
          finalFamilyId = String(famDoc.id || famDoc._id);
        } else {
          logs.push(`- Family "${familyName}" not found. Creating dynamically...`);
          const famSlug = String(familyName).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const newFamId = new ObjectId();
          const newFamData: any = {
            _id: newFamId,
            name: familyName,
            slug: famSlug,
            priority: 0,
            description: `A collection of premium Megaman ${familyName} products.`,
            media: placeholderImageId ? [toObjectId(placeholderImageId)] : [],
            categories: finalCategoryIds.map(id => toObjectId(id)),
            products: [],
            createdAt: now,
            updatedAt: now,
            __v: 0,
          };
          await familiesCollection.insertOne(newFamData);
          finalFamilyId = String(newFamId);
          familyCache.set(famKey, { ...newFamData, id: finalFamilyId });
          logs.push(`  Successfully created family "${familyName}".`);
        }
      } catch (err: any) {
        warnings.push(`Item ${itemIndex} (${modelNumber}): Error resolving family "${familyName}": ${err.message}`);
      }
    }

    // 4. Resolve Product Image in memory
    let imageId = placeholderImageId;
    const candidates = [
      String(modelNumber),
      String(modelNumber).replace(/\//g, '-'),
      String(modelNumber).replace(/\//g, '_'),
      String(modelNumber).replace(/\//g, ' '),
      String(modelNumber).replace(/-/g, ' '),
      String(modelNumber).replace(/\//g, '-').replace(/-/g, ' '),
    ].map(c => c.toLowerCase()).filter(Boolean);

    const matchedMedia = mediaList.find(m => candidates.some(cand => m.filename.includes(cand)));
    if (matchedMedia) {
      imageId = matchedMedia.id;
    }

    // 5. Queue Product upsert for bulkWrite
    try {
      const existing = existingProductsMap.get(modelKey);
      const cleanSpecs = { ...item };
      delete cleanSpecs._id;

      const setFields: Record<string, any> = {
        name: modelNumber,
        description: item.description || '',
        colour: item.fitting_colour && item.fitting_colour !== 'N/A' ? String(item.fitting_colour) : undefined,
        power: item.on_mode_power_w && item.on_mode_power_w !== 'N/A' ? String(item.on_mode_power_w) : undefined,
        colourTemperature: item.cct_k && item.cct_k !== 'N/A' ? String(item.cct_k) : undefined,
        specifications: cleanSpecs,
        updatedAt: now,
      };

      if (matchedMedia) {
        setFields.images = toObjectId(matchedMedia.id);
      } else if (!existing?.images && imageId) {
        setFields.images = toObjectId(imageId);
      }
      if (finalFamilyId) {
        setFields.families = toObjectId(finalFamilyId);
        touchedFamilyIds.add(String(finalFamilyId));
      }

      if (existing) {
        const prodIdStr = String(existing._id || existing.id);
        productBulkOps.push({
          updateOne: {
            filter: { _id: toObjectId(prodIdStr) },
            update: { $set: cleanUndefined(setFields) },
          },
        });
        if (isAccessoryProductType(item.product_type)) {
          accessoryProductIds.add(prodIdStr);
        }
        updatedCount++;
      } else {
        const newProdId = new ObjectId();
        const prodIdStr = String(newProdId);
        productBulkOps.push({
          updateOne: {
            filter: { _id: newProdId },
            update: {
              $set: cleanUndefined({
                ...setFields,
                sites: ['international', 'hk', 'uk'],
              }),
              $setOnInsert: {
                createdAt: now,
                __v: 0,
              },
            },
            upsert: true,
          },
        });
        if (isAccessoryProductType(item.product_type)) {
          accessoryProductIds.add(prodIdStr);
        }
        existingProductsMap.set(modelKey, { _id: newProdId, id: prodIdStr, ...setFields });
        createdCount++;
      }
    } catch (err: any) {
      warnings.push(`Item ${itemIndex} (${modelNumber}): Failed to create/update Product. Error: ${err.message}`);
    }
  }

  if (luminaireCollection && lumBulkOps.length > 0) {
    try {
      await luminaireCollection.bulkWrite(lumBulkOps, { ordered: false });
    } catch (err: any) {
      warnings.push(`Failed to sync specs in MongoDB luminaire: ${err.message}`);
    }
  }
  if (productBulkOps.length > 0) {
    await productsCollection.bulkWrite(productBulkOps, { ordered: false });
  }

  const toId = (v: any): string => String(typeof v === 'object' && v !== null ? (v._id || v.id || v) : v);
  for (const familyId of touchedFamilyIds) {
    try {
      const famObjId = toObjectId(familyId);
      const [familyDoc, familyProducts] = await Promise.all([
        familiesCollection.findOne({ _id: famObjId }, { projection: { _id: 1, name: 1, products: 1, accessoryProducts: 1 } }),
        productsCollection.find(
          { families: { $in: [famObjId, String(familyId)] } },
          { projection: { _id: 1, 'specifications.product_type': 1, 'specifications.categories': 1 } }
        ).toArray(),
      ]);

      if (!familyDoc) continue;

      const currentAccessoryIds: string[] = ((familyDoc as any).accessoryProducts || []).map(toId);
      const currentProductIds: string[] = ((familyDoc as any).products || []).map(toId);

      const mergedAccessories = new Set<string>(currentAccessoryIds);
      for (const p of familyProducts) {
        const pid = String(p._id);
        const isAcc =
          accessoryProductIds.has(pid) ||
          isAccessoryProductType((p as any)?.specifications?.product_type) ||
          isAccessoryProductType((p as any)?.specifications?.categories);
        if (isAcc) {
          mergedAccessories.add(pid);
        }
      }

      const mergedProducts = new Set<string>(currentProductIds.filter(id => !mergedAccessories.has(id)));
      for (const p of familyProducts) {
        const pid = String(p._id);
        if (!mergedAccessories.has(pid)) {
          mergedProducts.add(pid);
        }
      }

      await familiesCollection.updateOne(
        { _id: famObjId },
        {
          $set: {
            products: Array.from(mergedProducts).map(id => toObjectId(id)),
            accessoryProducts: Array.from(mergedAccessories).map(id => toObjectId(id)),
            updatedAt: new Date(),
          },
        }
      );
    } catch (err: any) {
      warnings.push(`Could not synchronize family "${familyId}" with products: ${err.message}`);
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
