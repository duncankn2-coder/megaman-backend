import { Payload } from 'payload';
import * as xlsx from 'xlsx';
import AdmZip from 'adm-zip';
import path from 'path';
import { ObjectId } from 'mongodb';
import { getMongoClient } from './mongoClient';
import { cleanValue } from './xlsxToJsonConverter';

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

function normalizeModelNumber(model: string): string {
  if (!model) return '';
  return model
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/v\d+/g, 'v');
}

function cleanHeaderToKey(header: string): string {
  if (!header) return '';
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_()]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/\(/g, '_')
    .replace(/\)/g, '')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export interface ImportResult {
  success: boolean;
  productsCreated: number;
  productsUpdated: number;
  skusCreated: number;
  skusUpdated: number;
  warnings: string[];
  logs: string[];
}

export async function processLightSourceBulkImport(
  payload: Payload,
  xlsxBuffer: Buffer,
  zipBuffer?: Buffer
): Promise<ImportResult> {
  const warnings: string[] = [];
  const logs: string[] = [];
  let productsCreated = 0;
  let productsUpdated = 0;
  let skusCreated = 0;
  let skusUpdated = 0;

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


  const filesMap = new Map<string, AdmZip.IZipEntry>();
  if (zipBuffer) {
    logs.push('Initializing ZIP archive parser...');
    let zip: AdmZip;
    try {
      zip = new AdmZip(zipBuffer);
    } catch (error: any) {
      throw new Error(`Failed to parse ZIP file: ${error.message}`);
    }

    const zipEntries = zip.getEntries();
    logs.push(`Found ${zipEntries.length} file entries in the ZIP archive.`);

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const filename = path.basename(entry.entryName).toLowerCase();
      filesMap.set(filename, entry);
    }
  } else {
    logs.push('No Media Assets Archive provided. Media/Photometry import will be skipped.');
  }

  // Connect to MongoDB to upsert general_data.light_source
  let lightSourceCollection: any = null;
  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db('general_data');
    lightSourceCollection = db.collection('light_source');
    logs.push('Successfully connected to general_data MongoDB database.');
  } catch (err: any) {
    warnings.push(`Could not connect to MongoDB for syncing specifications: ${err.message}. Spec sync to DB will be skipped.`);
  }

  // Helper to upload media file from ZIP
  const uploadAssetFromZip = async (
    specifiedName: string | undefined,
    fallbackPatterns: string[],
    altText: string,
    type: 'image' | 'video' | 'document'
  ): Promise<string | null> => {
    let cleanName = (specifiedName || '').trim();
    const lookupName = cleanName.toLowerCase();
    let zipEntry = cleanName ? filesMap.get(lookupName) : null;

    if (!zipEntry) {
      for (const pattern of fallbackPatterns) {
        const tryName = pattern.toLowerCase();
        const entry = filesMap.get(tryName);
        if (entry) {
          zipEntry = entry;
          cleanName = path.basename(entry.entryName);
          break;
        }
      }
    }

    if (!zipEntry) {
      return null;
    }

    const fileBuffer = zipEntry.getData();
    const size = fileBuffer.length;

    let mimetype = 'application/octet-stream';
    const ext = path.extname(cleanName).toLowerCase();
    if (ext === '.png') mimetype = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimetype = 'image/jpeg';
    else if (ext === '.gif') mimetype = 'image/gif';
    else if (ext === '.svg') mimetype = 'image/svg+xml';
    else if (ext === '.pdf') mimetype = 'application/pdf';
    else if (ext === '.ldt') mimetype = 'application/octet-stream';
    else if (ext === '.ies') mimetype = 'application/octet-stream';
    else if (ext === '.rfa') mimetype = 'application/octet-stream';

    try {
      const mediaDoc = await payload.create({
        collection: 'media',
        data: {
          alt: altText,
          type: type,
        },
        file: {
          data: fileBuffer,
          name: cleanName,
          size: size,
          mimetype: mimetype,
        },
      });
      return mediaDoc.id;
    } catch (err: any) {
      warnings.push(`Failed to upload ZIP file "${cleanName}": ${err.message}`);
      return null;
    }
  };

  logs.push('Parsing Light Source spreadsheet...');
  let workbook: xlsx.WorkBook;
  try {
    workbook = xlsx.read(xlsxBuffer, { type: 'buffer' });
  } catch (error: any) {
    throw new Error(`Failed to parse Light Source Excel file: ${error.message}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Spreadsheet does not contain any sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  if (rawRows.length < 2) {
    throw new Error('Spreadsheet structure invalid. Expected at least 1 header row and 1 data row.');
  }

  // Row 0 contains English headers
  const originalHeaders = rawRows[0].map(h => String(h || '').trim());
  const cleanKeys = originalHeaders.map(cleanHeaderToKey);

  // Find index of important columns dynamically
  const idxModelNo = cleanKeys.indexOf('new_erp_model_no');
  const idxMmCode = cleanKeys.indexOf('mm_code');
  const idxProductCode = cleanKeys.indexOf('product_code');
  const idxDescription = cleanKeys.indexOf('supplier_description') !== -1
    ? cleanKeys.indexOf('supplier_description')
    : cleanKeys.indexOf('description');
  const idxFamily = cleanKeys.indexOf('shape') !== -1
    ? cleanKeys.indexOf('shape')
    : cleanKeys.indexOf('series');
  const idxCategory1 = cleanKeys.indexOf('category1');
  const idxCategory2 = cleanKeys.indexOf('category2');
  const idxColour = cleanKeys.indexOf('housing_colour');
  const idxWattage = cleanKeys.indexOf('on_mode_power');
  const idxLampBase = cleanKeys.indexOf('cap_base');
  const idxColourTemp = cleanKeys.indexOf('correlated_colour_temperature');
  const idxVoltage = cleanKeys.indexOf('input_voltage');

  if (idxModelNo === -1) {
    throw new Error('Could not find "New ErP Model No." column in spreadsheet.');
  }
  if (idxMmCode === -1) {
    throw new Error('Could not find "MM Code" column in spreadsheet.');
  }

  const mongoClient = await getMongoClient();
  const payloadDb = (payload.db as any)?.connection?.db || mongoClient.db();
  const productsCollection = payloadDb.collection('products');
  const skusCollection = payloadDb.collection('skus');
  const familiesCollection = payloadDb.collection('families');
  const categoriesCollection = payloadDb.collection('categories');

  const parentProductsMap = new Map<string, string>(); // modelNumber -> ProductID
  const parentProductNamesMap = new Map<string, string>(); // productID -> originalName

  // Pre-fetch categories, families, products, and SKUs in parallel
  const categoryCache = new Map<string, string>();
  const familyCache = new Map<string, any>();
  const existingProductsMap = new Map<string, any>();
  const existingSkusMap = new Map<string, any>();

  try {
    const [existingCats, existingFams, existingProds, existingSkus] = await Promise.all([
      categoriesCollection.find({}, { projection: { _id: 1, name: 1 } }).toArray(),
      familiesCollection.find({}, { projection: { _id: 1, name: 1, dismantleInstructionPdf: 1 } }).toArray(),
      productsCollection.find({}, { projection: { _id: 1, name: 1, images: 1 } }).toArray(),
      skusCollection.find({}, { projection: { _id: 1, name: 1 } }).toArray(),
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
    existingSkus.forEach((s: any) => {
      if (s.name) existingSkusMap.set(String(s.name).toLowerCase().trim(), s);
    });
  } catch (e: any) {
    warnings.push(`Pre-fetch cache warning: ${e.message}`);
  }

  const lsBulkOps: any[] = [];
  const productBulkOps: any[] = [];
  const skuBulkOps: any[] = [];
  const now = new Date();

  // Process rows from index 1 onwards
  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const modelNo = String(row[idxModelNo] || '').trim();
    const mmCodeRaw = String(row[idxMmCode] || '').trim();
    if (!modelNo || modelNo.toLowerCase() === 'n/a' || modelNo === 'undefined') continue;
    if (!mmCodeRaw || mmCodeRaw.toLowerCase() === 'n/a' || mmCodeRaw === 'undefined') continue;

    // Use normalized model number for mapping, but original for CMS title
    const normalizedModel = normalizeModelNumber(modelNo);
    const mmCode = (mmCodeRaw && /^\d{6}\//.test(mmCodeRaw)) ? mmCodeRaw.substring(7) : mmCodeRaw;

    logs.push(`Processing row ${i + 1}: MM Code "${mmCode}" for model "${modelNo}"...`);

    // Clean all row values into a spec record
    const specRecord: Record<string, any> = {};
    for (let colIdx = 0; colIdx < cleanKeys.length; colIdx++) {
      const key = cleanKeys[colIdx];
      if (!key) continue;
      specRecord[key] = cleanValue(row[colIdx], key);
    }
    if (specRecord['mm_code']) {
      const val = String(specRecord['mm_code']).trim();
      if (/^\d{6}\//.test(val)) {
        specRecord['mm_code'] = val.substring(7);
      }
    }

    if (lightSourceCollection) {
      lsBulkOps.push({
        updateOne: {
          filter: { mm_code: mmCode },
          update: { $set: specRecord },
          upsert: true,
        },
      });
    }

    // Handle Category resolution
    const catName1 = idxCategory1 !== -1 ? String(row[idxCategory1] || '').trim() : '';
    const catName2 = idxCategory2 !== -1 ? String(row[idxCategory2] || '').trim() : '';
    const categoryNames = [catName1, catName2].filter(c => c && c.toLowerCase() !== 'n/a' && c !== '-');
    const categoryIds: string[] = [];

    for (const catName of categoryNames) {
      const catKey = catName.toLowerCase().trim();
      let catId = categoryCache.get(catKey);
      if (!catId) {
        const newCatId = new ObjectId();
        await categoriesCollection.insertOne({
          _id: newCatId,
          name: catName,
          createdAt: now,
          updatedAt: now,
          __v: 0,
        });
        catId = String(newCatId);
        categoryCache.set(catKey, catId);
      }
      categoryIds.push(catId);
    }

    // Resolve Image from ZIP
    const cleanMmForLookup = mmCode.replace(/\//g, '-').replace(/\s+/g, '');
    let imageId: string | null = null;
    if (filesMap.size > 0) {
      const normalizedModels = [
        modelNo,
        modelNo.replace(/\//g, '-'),
        modelNo.replace(/\//g, '_'),
        modelNo.replace(/\//g, ' '),
      ];
      const imageFallbacks: string[] = [];
      for (const m of normalizedModels) {
        imageFallbacks.push(`${m}.png`, `${m}.jpg`, `${m}.jpeg`);
      }
      imageFallbacks.unshift(`${cleanMmForLookup}.png`, `${cleanMmForLookup}.jpg`, `${cleanMmForLookup}.jpeg`);
      imageId = await uploadAssetFromZip(undefined, imageFallbacks, `Image for ${modelNo}`, 'image');
    }

    // Resolve Family (Series)
    const familyName = idxFamily !== -1 ? String(row[idxFamily] || '').trim() : '';
    let familyId: string | null = null;
    if (familyName && familyName.toLowerCase() !== 'n/a' && familyName !== '-') {
      try {
        const famKey = familyName.toLowerCase().trim();
        let famDoc = familyCache.get(famKey);

        let diPdfId: string | null = null;
        if (filesMap.size > 0) {
          const cleanFamName = familyName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
          const famSlugName = familyName.toLowerCase().replace(/\s+/g, '-');
          const diFallbacks = [
            `${cleanFamName}_di.pdf`,
            `${famSlugName}_di.pdf`,
            `${familyName.toLowerCase()}_di.pdf`,
            `${familyName.toLowerCase()}-di.pdf`,
          ];
          diPdfId = await uploadAssetFromZip(undefined, diFallbacks, `Dismantle Instruction PDF for ${familyName}`, 'document');
        }

        if (famDoc) {
          familyId = String(famDoc.id || famDoc._id);
          if (diPdfId && !famDoc.dismantleInstructionPdf) {
            await familiesCollection.updateOne(
              { _id: toObjectId(familyId) },
              { $set: { dismantleInstructionPdf: toObjectId(diPdfId), updatedAt: now } }
            );
            famDoc.dismantleInstructionPdf = diPdfId;
          }
        } else {
          const familyImageId = imageId || placeholderImageId;
          const famSlug = familyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const newFamId = new ObjectId();
          const newFamData: any = {
            _id: newFamId,
            name: familyName,
            slug: famSlug,
            priority: 0,
            description: `A collection of premium Megaman ${familyName} light sources.`,
            media: familyImageId ? [toObjectId(familyImageId)] : [],
            categories: categoryIds.map(id => toObjectId(id)),
            products: [],
            createdAt: now,
            updatedAt: now,
            __v: 0,
          };
          if (diPdfId) newFamData.dismantleInstructionPdf = toObjectId(diPdfId);

          await familiesCollection.insertOne(newFamData);
          familyId = String(newFamId);
          familyCache.set(famKey, { ...newFamData, id: familyId });
        }
      } catch (err: any) {
        warnings.push(`Failed to resolve or create family "${familyName}": ${err.message}`);
      }
    }

    // Resolve Parent Product
    let parentProductId = parentProductsMap.get(normalizedModel);
    if (!parentProductId) {
      const modelKey = modelNo.toLowerCase().trim();
      const existing = existingProductsMap.get(modelKey);

      const desc = idxDescription !== -1 ? String(row[idxDescription] || '').trim() : '';
      const setFields: Record<string, any> = {
        name: modelNo,
        description: desc || undefined,
        specifications: specRecord,
        updatedAt: now,
      };
      if (imageId) {
        setFields.images = toObjectId(imageId);
      } else if (!existing?.images && placeholderImageId) {
        setFields.images = toObjectId(placeholderImageId);
      }
      if (familyId) {
        setFields.families = toObjectId(familyId);
      }

      if (existing) {
        parentProductId = String(existing._id || existing.id);
        productBulkOps.push({
          updateOne: {
            filter: { _id: toObjectId(parentProductId) },
            update: { $set: cleanUndefined(setFields) },
          },
        });
        productsUpdated++;
      } else {
        const newProdId = new ObjectId();
        parentProductId = String(newProdId);
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
        existingProductsMap.set(modelKey, { _id: newProdId, id: parentProductId, ...setFields });
        productsCreated++;
      }
      parentProductsMap.set(normalizedModel, parentProductId);
      parentProductNamesMap.set(parentProductId, modelNo);
    }

    // Create or Update SKU variant
    const productCode = idxProductCode !== -1 ? String(row[idxProductCode] || '').trim() : '';
    const colour = idxColour !== -1 ? String(row[idxColour] || '').trim() : '';
    const wattage = idxWattage !== -1 ? String(row[idxWattage] || '').trim() : '';
    const lampBase = idxLampBase !== -1 ? String(row[idxLampBase] || '').trim() : '';
    const colourTemp = idxColourTemp !== -1 ? String(row[idxColourTemp] || '').trim() : '';
    const voltage = idxVoltage !== -1 ? String(row[idxVoltage] || '').trim() : '';

    const ldtId = filesMap.size > 0 ? await uploadAssetFromZip(undefined, [`${cleanMmForLookup}.ldt`, `${normalizedModel}.ldt`], `LDT Photometrics for ${mmCode}`, 'document') : null;
    const iesId = filesMap.size > 0 ? await uploadAssetFromZip(undefined, [`${cleanMmForLookup}.ies`, `${normalizedModel}.ies`], `IES Photometrics for ${mmCode}`, 'document') : null;

    try {
      const skuKey = mmCode.toLowerCase().trim();
      const existing = existingSkusMap.get(skuKey);

      const skuSetFields: Record<string, any> = {
        name: mmCode,
        product: toObjectId(parentProductId),
        modelNumber: modelNo,
        colour: colour || undefined,
        specialFeatures: productCode || undefined,
        wattage: wattage || undefined,
        lampBase: lampBase || undefined,
        colourTemperature: colourTemp || undefined,
        voltage: voltage || undefined,
        specifications: specRecord,
        updatedAt: now,
      };

      if (ldtId) skuSetFields.photometryLdt = toObjectId(ldtId);
      if (iesId) skuSetFields.photometryIes = toObjectId(iesId);

      if (existing) {
        skuBulkOps.push({
          updateOne: {
            filter: { _id: existing._id },
            update: { $set: cleanUndefined(skuSetFields) },
          },
        });
        skusUpdated++;
      } else {
        const newSkuId = new ObjectId();
        skuBulkOps.push({
          updateOne: {
            filter: { name: mmCode },
            update: {
              $set: cleanUndefined(skuSetFields),
              $setOnInsert: {
                createdAt: now,
                __v: 0,
              },
            },
            upsert: true,
          },
        });
        existingSkusMap.set(skuKey, { _id: newSkuId, name: mmCode });
        skusCreated++;
      }
    } catch (err: any) {
      warnings.push(`SKU Error for "${mmCode}": ${err.message}`);
    }
  }

  if (lightSourceCollection && lsBulkOps.length > 0) {
    try {
      await lightSourceCollection.bulkWrite(lsBulkOps, { ordered: false });
    } catch (err: any) {
      warnings.push(`Failed to sync specs to MongoDB light_source: ${err.message}`);
    }
  }
  if (productBulkOps.length > 0) {
    await productsCollection.bulkWrite(productBulkOps, { ordered: false });
  }
  if (skuBulkOps.length > 0) {
    await skusCollection.bulkWrite(skuBulkOps, { ordered: false });
  }

  logs.push(`Light Source bulk import completed. Products (Created: ${productsCreated}, Updated: ${productsUpdated}), SKUs (Created: ${skusCreated}, Updated: ${skusUpdated}).`);

  return {
    success: true,
    productsCreated,
    productsUpdated,
    skusCreated,
    skusUpdated,
    warnings,
    logs,
  };
}
