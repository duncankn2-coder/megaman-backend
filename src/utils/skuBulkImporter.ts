import { Payload } from 'payload';
import * as xlsx from 'xlsx';
import AdmZip from 'adm-zip';
import path from 'path';
import { ObjectId } from 'mongodb';
import { processXlsxToJson, findHeadersRowIndex } from './xlsxToJsonConverter';
import { fetchSpecifications } from './fetchSpecifications';
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

function getModelPrefix(model: string): string {
  if (!model) return '';
  const base = model.replace(/v\d+/gi, '');
  const match = base.match(/^[a-zA-Z0-9]+/);
  return match ? match[0] : base.substring(0, 6);
}

function normalizeModelNumber(model: string): string {
  if (!model) return '';
  return model
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/v\d+/g, 'v');
}

function cleanModel(model: string): string {
  if (!model) return '';
  return model
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '')
    .replace(/\//g, '')
    .replace(/dl/g, '')
    .replace(/ds/g, '')
    .replace(/sc/g, '');
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

export async function processSkuBulkImport(
  payload: Payload,
  generalXlsxBuffer?: Buffer,
  skuXlsxBuffer?: Buffer,
  zipBuffer?: Buffer
): Promise<ImportResult> {
  const warnings: string[] = [];
  const logs: string[] = [];
  let productsCreated = 0;
  let productsUpdated = 0;
  let skusCreated = 0;
  let skusUpdated = 0;

  const mongoClient = await getMongoClient();
  const payloadDb = (payload.db as any)?.connection?.db || mongoClient.db();
  const productsCollection = payloadDb.collection('products');
  const skusCollection = payloadDb.collection('skus');
  const familiesCollection = payloadDb.collection('families');
  const categoriesCollection = payloadDb.collection('categories');
  const mediaCollection = payloadDb.collection('media');

  // Find or create default placeholder image in Media collection
  let placeholderImageId: string | null = null;
  try {
    const existingPlaceholder = await mediaCollection.findOne(
      { alt: 'Placeholder Image' },
      { projection: { _id: 1 } }
    );

    if (existingPlaceholder) {
      placeholderImageId = String(existingPlaceholder._id);
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
      placeholderImageId = String(newMedia.id);
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

  // Helper to resolve fields dynamically from Excel row objects
  const getField = (row: any, candidates: string[]): string | undefined => {
    for (const cand of candidates) {
      if (row[cand] !== undefined && row[cand] !== null) {
        return String(row[cand]).trim();
      }
      for (const key of Object.keys(row)) {
        const cleanKey = key.trim().toLowerCase().replace(/\r?\n/g, ' ');
        const cleanCand = cand.trim().toLowerCase();
        if (cleanKey === cleanCand || cleanKey.includes(cleanCand)) {
          return String(row[key]).trim();
        }
      }
    }
    return undefined;
  };

  const parentProductsMap = new Map<string, string>(); // modelNumber -> ProductID
  const parentProductNamesMap = new Map<string, string>(); // productID -> originalName
  const productSpecsByIdMap = new Map<string, any>(); // productID -> specifications
  const accessoryProductIds = new Set<string>(); // productIDs whose Column C (product_type) is Accessories
  const touchedFamilyIds = new Set<string>(); // families affected by this import (only these get re-synced)
  const diCheckedFamilies = new Set<string>(); // families already checked for a DI PDF in the ZIP
  let generalSpecs: any[] = [];
  const generalSpecsListMap = new Map<string, any[]>(); // modelKey -> list of generalSpecs rows (supports multi-colour variants)

  // Check whether Column C (product_type) indicates an Accessory / Optional Part
  const isAccessoryProductType = (val: any): boolean => {
    if (!val) return false;
    const clean = String(val).trim().toLowerCase();
    return clean === 'accessories' || clean === 'accessory' || /^accessor(y|ies)\b/i.test(clean);
  };

  // Extract color from General Data description or fitting_colour
  const extractGeneralColor = (specs: any): string => {
    if (!specs) return '';
    if (specs.fitting_colour && specs.fitting_colour !== 'null' && specs.fitting_colour !== null) {
      return String(specs.fitting_colour).trim();
    }
    if (specs.description) {
      const match = String(specs.description).match(/Colou?r\s*:\s*([^/,\r\n]+)/i);
      if (match) return match[1].trim();
    }
    return '';
  };

  // Match the right General Data row when multiple rows share the same customer_model_no_new (e.g. White vs Nickel brushed)
  const findBestMatchingSpec = (candidates: any[] | undefined, skuColour?: string): any => {
    if (!candidates || candidates.length === 0) return null;
    if (candidates.length === 1 || !skuColour) return candidates[0];
    const cleanSkuCol = skuColour.trim().toLowerCase();
    if (!cleanSkuCol || cleanSkuCol === '/' || /^\d{4}/.test(cleanSkuCol)) return candidates[0];

    const matchesColorToken = (spec: any): boolean => {
      const genCol = extractGeneralColor(spec).toLowerCase();
      const optCode = String(spec?.option_code || '').toLowerCase();
      const ykModel = String(spec?.yk_model_no || '').toLowerCase();
      const haystack = `${genCol} | ${optCode} | ${ykModel}`;

      if (genCol && (genCol === cleanSkuCol || genCol.includes(cleanSkuCol) || cleanSkuCol.includes(genCol))) {
        return true;
      }
      if (/^(wh|wt|white|白)$/i.test(cleanSkuCol)) {
        return genCol.includes('white') || /\b(wh|wt)\b/i.test(haystack);
      }
      if (/^(ni|nb|nickel|nickel\s*brushed)$/i.test(cleanSkuCol)) {
        return genCol.includes('nickel') || /\b(ni|nb)\b/i.test(haystack);
      }
      if (/^(bk|bl|black|黑)$/i.test(cleanSkuCol)) {
        return genCol.includes('black') || /\b(bk|bl)\b/i.test(haystack);
      }
      if (/^(sv|si|silver|银)$/i.test(cleanSkuCol)) {
        return genCol.includes('silver') || /\b(sv|si)\b/i.test(haystack);
      }
      if (/^(gr|gy|grey|gray|灰)$/i.test(cleanSkuCol)) {
        return genCol.includes('grey') || genCol.includes('gray') || /\b(gr|gy)\b/i.test(haystack);
      }
      return haystack.includes(cleanSkuCol);
    };

    return candidates.find(matchesColorToken) || candidates[0];
  };

  // ==========================================
  // PHASE 1: Parse General Data & Create Parent Products
  // ==========================================
  if (generalXlsxBuffer && generalXlsxBuffer.length > 0) {
    logs.push('Parsing General Data using schema converter...');
    try {
      generalSpecs = await processXlsxToJson(generalXlsxBuffer);
      logs.push(`Successfully parsed ${generalSpecs.length} specification rows using schema converter.`);

      for (const spec of generalSpecs) {
        const key = String(spec?.customer_model_no_new || '').toLowerCase().trim();
        if (!key) continue;
        const list = generalSpecsListMap.get(key) || [];
        list.push(spec);
        generalSpecsListMap.set(key, list);
      }

      // Sync generalSpecs to general_data.luminaire via single bulkWrite (deduplicated by customer_model_no_new)
      try {
        const db = mongoClient.db('general_data');
        const luminaireCollection = db.collection('luminaire');
        logs.push('Connected to general_data MongoDB database for syncing specifications.');

        if (generalSpecs.length > 0) {
          const seenLumModels = new Set<string>();
          const bulkOps: any[] = [];
          for (const spec of generalSpecs) {
            const modelNumber = spec.customer_model_no_new || spec.yk_model_no;
            if (!modelNumber) continue;
            const normKey = String(modelNumber).toLowerCase().trim();
            if (seenLumModels.has(normKey)) continue;
            seenLumModels.add(normKey);

            const cleanItem = { ...spec };
            delete cleanItem._id;
            bulkOps.push({
              updateOne: {
                filter: { customer_model_no_new: modelNumber },
                update: { $set: cleanItem },
                upsert: true,
              },
            });
          }

          if (bulkOps.length > 0) {
            logs.push(`Syncing ${bulkOps.length} unique model specification rows to MongoDB...`);
            await luminaireCollection.bulkWrite(bulkOps, { ordered: false });
          }
          logs.push('Successfully synced specifications to MongoDB general_data.luminaire.');
        }
      } catch (err: any) {
        warnings.push(`Could not sync specifications to general_data database: ${err.message}`);
      }
    } catch (err: any) {
      warnings.push(`Schema converter failed: ${err.message}. Proceeding without variant-specific specifications.`);
    }

    logs.push('Parsing General Data spreadsheet...');
    let generalWorkbook: xlsx.WorkBook;
    try {
      generalWorkbook = xlsx.read(generalXlsxBuffer, { type: 'buffer' });
    } catch (error: any) {
      throw new Error(`Failed to parse General Data Excel file: ${error.message}`);
    }

    const generalSheetName = generalWorkbook.SheetNames[0];
    if (!generalSheetName) {
      throw new Error('General Data Spreadsheet does not contain any sheets.');
    }

    const generalSheet = generalWorkbook.Sheets[generalSheetName];
    // Parse general data rows, skipping the multi-row metadata header
    const rawGeneralRows: any[][] = xlsx.utils.sheet_to_json(generalSheet, { header: 1 });
    if (rawGeneralRows.length < 5) {
      throw new Error('General Data Spreadsheet structure invalid. Expected at least 4 header rows.');
    }

    // Dynamically detect headers row index
    const genHeadersRowIdx = findHeadersRowIndex(rawGeneralRows);
    const genHeaders = rawGeneralRows[genHeadersRowIdx].map(h => String(h || '').trim());
    const findColIndex = (headers: string[], candidates: string[]): number => {
      for (const cand of candidates) {
        const idx = headers.findIndex(h => h && h.toLowerCase() === cand.toLowerCase());
        if (idx !== -1) return idx;
      }
      // Substring match fallback
      for (const cand of candidates) {
        const idx = headers.findIndex(h => h && h.toLowerCase().includes(cand.toLowerCase()));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idxModelNo = (genHeaders.length > 8 && genHeaders[8] && (genHeaders[8].toLowerCase().includes('model') || genHeaders[8].toLowerCase().includes('customer')))
      ? 8
      : findColIndex(genHeaders, [
        'customer_model_no_new',
        'Customer Model No.  (NEW ErP)',
        'Customer Model No.(NEW ErP)',
        'New ErP Model No.',
        'New ErP Model No',
        'Customer Model No.(new)',
        'model_number',
        'Model Number',
        'customer_model_no_new',
        'Product Code',
        'MM Code'
      ]);
    const idxDescription = findColIndex(genHeaders, ['description', 'desc', '描述']);
    const idxFamily = findColIndex(genHeaders, ['series name', 'series_name', 'series', 'family', '系列名']);
    const idxCategory = findColIndex(genHeaders, ['product_type', 'product type', 'category1', 'category2', 'category', '产品类型']);

    if (idxModelNo === -1) {
      throw new Error('Could not find Model Number column in General Data Excel.');
    }

    // Pre-fetch families, categories, and existing products in parallel via native MongoDB queries
    const familyCache = new Map<string, any>(); // familyName.toLowerCase() -> familyDoc
    const categoryCache = new Map<string, string>(); // categoryName.toLowerCase() -> categoryId
    const existingProductsMap = new Map<string, any>(); // modelNo.toLowerCase() -> productDoc
    const allGenModelNos = Array.from(
      new Set(
        rawGeneralRows
          .slice(4)
          .map(r => String(r?.[idxModelNo] || '').trim())
          .filter(m => m && m.toLowerCase() !== 'n/a' && m !== 'undefined')
      )
    );

    try {
      const [existingFams, existingCats, existingProds] = await Promise.all([
        familiesCollection.find({}, { projection: { _id: 1, name: 1, dismantleInstructionPdf: 1 } }).toArray(),
        categoriesCollection.find({}, { projection: { _id: 1, name: 1 } }).toArray(),
        allGenModelNos.length > 0
          ? productsCollection.find(
              { name: { $in: allGenModelNos } },
              { projection: { _id: 1, name: 1, images: 1, families: 1, power: 1, colourTemperature: 1, colour: 1, specifications: 1 } }
            ).toArray()
          : Promise.resolve([]),
      ]);

      existingFams.forEach((f: any) => {
        if (f.name) familyCache.set(String(f.name).toLowerCase().trim(), { ...f, id: String(f._id) });
      });
      existingCats.forEach((c: any) => {
        if (c.name) categoryCache.set(String(c.name).toLowerCase().trim(), String(c._id));
      });
      existingProds.forEach((p: any) => {
        if (p.name) existingProductsMap.set(String(p.name).toLowerCase().trim(), { ...p, id: String(p._id) });
      });
    } catch (e: any) {
      warnings.push(`Pre-fetch cache warning: ${e.message}`);
    }

    const seenModelsInPhase1 = new Set<string>();
    const productBulkOps: any[] = [];
    const now = new Date();

    // Process general data rows (row index 4 onwards)
    for (let i = 4; i < rawGeneralRows.length; i++) {
      const row = rawGeneralRows[i];
      if (!row || row.length === 0) continue;

      const modelNo = String(row[idxModelNo] || '').trim();
      if (!modelNo || modelNo.toLowerCase() === 'n/a' || modelNo === 'undefined') continue;

      const modelKey = modelNo.toLowerCase().trim();
      if (seenModelsInPhase1.has(modelKey)) {
        // Duplicate model row in General Data (e.g. second colour variant of the same base model);
        // its specs are already captured in generalSpecsListMap for SKU variant matching in Phase 2.
        continue;
      }
      seenModelsInPhase1.add(modelKey);

      const desc = idxDescription !== -1 ? String(row[idxDescription] || '').trim() : '';
      const familyName = idxFamily !== -1 ? String(row[idxFamily] || '').trim() : '';
      const colCProductType = String(row[2] ?? '').trim();
      const categoryName = colCProductType || (idxCategory !== -1 ? String(row[idxCategory] || '').trim() : '');
      const isRowAccessory = isAccessoryProductType(colCProductType) || (idxCategory !== -1 && isAccessoryProductType(row[idxCategory]));

      logs.push(`Processing base product model "${modelNo}"...`);

      // Normalized file lookups for primary image (only if ZIP archive was uploaded)
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
        imageId = await uploadAssetFromZip(undefined, imageFallbacks, `Primary image for ${modelNo}`, 'image');
      }

      // Category match using in-memory cache
      const categoryIds: string[] = [];
      if (categoryName) {
        const catKey = categoryName.toLowerCase().trim();
        let catId = categoryCache.get(catKey);
        if (!catId) {
          const newCatId = new ObjectId();
          await categoriesCollection.insertOne({
            _id: newCatId,
            name: categoryName,
            createdAt: now,
            updatedAt: now,
            __v: 0,
          });
          catId = String(newCatId);
          categoryCache.set(catKey, catId);
        }
        categoryIds.push(catId);
      }

      // Family match using in-memory cache
      let familyId: string | null = null;
      if (familyName) {
        try {
          const famKey = familyName.toLowerCase().trim();
          let famDoc = familyCache.get(famKey);
          if (famDoc) {
            familyId = String(famDoc.id || famDoc._id);
            // Attach a Dismantle Instruction PDF from the ZIP to an existing family once, if it has none yet
            if (filesMap.size > 0 && !famDoc.dismantleInstructionPdf && !diCheckedFamilies.has(famKey)) {
              diCheckedFamilies.add(famKey);
              const cleanFamName = familyName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
              const famSlugName = familyName.toLowerCase().replace(/\s+/g, '-');
              const diPdfId = await uploadAssetFromZip(undefined, [
                `${cleanFamName}_di.pdf`,
                `${famSlugName}_di.pdf`,
                `${familyName.toLowerCase()}_di.pdf`,
                `${familyName.toLowerCase()}-di.pdf`,
              ], `Dismantle Instruction PDF for ${familyName}`, 'document');
              if (diPdfId) {
                await familiesCollection.updateOne(
                  { _id: toObjectId(familyId) },
                  { $set: { dismantleInstructionPdf: toObjectId(diPdfId), updatedAt: now } }
                );
                famDoc.dismantleInstructionPdf = diPdfId;
              }
            }
          } else {
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
            const familyImageId = imageId || placeholderImageId;
            const famSlug = familyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const newFamId = new ObjectId();
            const newFamDoc: any = {
              _id: newFamId,
              name: familyName,
              slug: famSlug,
              priority: 0,
              description: `A collection of premium Megaman ${familyName} products.`,
              media: familyImageId ? [toObjectId(familyImageId)] : [],
              categories: categoryIds.map(id => toObjectId(id)),
              products: [],
              createdAt: now,
              updatedAt: now,
              __v: 0,
            };
            if (diPdfId) newFamDoc.dismantleInstructionPdf = toObjectId(diPdfId);

            await familiesCollection.insertOne(newFamDoc);
            familyId = String(newFamId);
            familyCache.set(famKey, { ...newFamDoc, id: familyId });
          }
        } catch (err: any) {
          warnings.push(`Failed to resolve or create family "${familyName}": ${err.message}`);
        }
      }

      // Queue Base Product upsert for bulkWrite
      try {
        const existing = existingProductsMap.get(modelKey);

        let productSpecs: any = (generalSpecsListMap.get(modelKey) || [])[0] || null;
        if (!productSpecs) {
          try {
            productSpecs = await fetchSpecifications(modelNo);
          } catch (err) {
            // Ignore
          }
        }

        const setFields: Record<string, any> = {
          name: modelNo,
          description: desc,
          updatedAt: now,
        };

        if (productSpecs) {
          setFields.specifications = productSpecs;
          if (productSpecs.on_mode_power_w) {
            setFields.power = String(productSpecs.on_mode_power_w);
          }
          if (productSpecs.cct_k) {
            setFields.colourTemperature = String(productSpecs.cct_k);
          }
          if (productSpecs.fitting_colour) {
            setFields.colour = String(productSpecs.fitting_colour);
          }
        }

        if (imageId) {
          setFields.images = toObjectId(imageId);
        } else if (!existing?.images && placeholderImageId) {
          setFields.images = toObjectId(placeholderImageId);
        }

        if (familyId) {
          setFields.families = toObjectId(familyId);
          touchedFamilyIds.add(String(familyId));
        }

        if (existing) {
          const prodIdStr = String(existing._id || existing.id);
          productBulkOps.push({
            updateOne: {
              filter: { _id: toObjectId(prodIdStr) },
              update: { $set: cleanUndefined(setFields) },
            },
          });
          parentProductsMap.set(modelKey, prodIdStr);
          parentProductNamesMap.set(prodIdStr, modelNo);
          productSpecsByIdMap.set(prodIdStr, productSpecs || existing.specifications);
          if (isRowAccessory || isAccessoryProductType(productSpecs?.product_type)) {
            accessoryProductIds.add(prodIdStr);
          }
          productsUpdated++;
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
          parentProductsMap.set(modelKey, prodIdStr);
          parentProductNamesMap.set(prodIdStr, modelNo);
          productSpecsByIdMap.set(prodIdStr, productSpecs);
          if (isRowAccessory || isAccessoryProductType(productSpecs?.product_type)) {
            accessoryProductIds.add(prodIdStr);
          }
          existingProductsMap.set(modelKey, { _id: newProdId, id: prodIdStr, ...setFields });
          productsCreated++;
        }
      } catch (err: any) {
        warnings.push(`Base Product error for "${modelNo}": ${err.message}`);
      }
    }

    if (productBulkOps.length > 0) {
      await productsCollection.bulkWrite(productBulkOps, { ordered: false });
    }

    logs.push(`Successfully loaded base models. Total active model mappings: ${parentProductsMap.size}`);
  } else {
    logs.push('No General Data spreadsheet provided. Parent product creation phase will be skipped.');
  }

  // ==========================================
  // PHASE 2: Parse SKU MM Code Sheet & Create SKUs
  // ==========================================
  if (skuXlsxBuffer && skuXlsxBuffer.length > 0) {
    logs.push('Parsing SKU MM Code spreadsheet...');
    let skuWorkbook: xlsx.WorkBook;
    try {
      skuWorkbook = xlsx.read(skuXlsxBuffer, { type: 'buffer' });
    } catch (error: any) {
      throw new Error(`Failed to parse SKU MM Code Excel file: ${error.message}`);
    }

    const skuSheetName = skuWorkbook.SheetNames[0];
    if (!skuSheetName) {
      throw new Error('SKU Spreadsheet does not contain any sheets.');
    }

    const skuSheet = skuWorkbook.Sheets[skuSheetName];
    const skuRows = xlsx.utils.sheet_to_json<any>(skuSheet, { defval: null });
    const rawSkuRows: any[][] = xlsx.utils.sheet_to_json(skuSheet, { header: 1 });
    const skuHeadersRow = (rawSkuRows[0] || []).map(h => String(h || '').trim().toLowerCase());
    const useColCForModel = skuHeadersRow.length > 2 && (skuHeadersRow[2].includes('model') || skuHeadersRow[2] === '');
    const useColJForMmCode = skuHeadersRow.length > 9 && (skuHeadersRow[9].includes('mm') || skuHeadersRow[9].includes('code'));
    logs.push(`Found ${skuRows.length} SKU rows to process.`);

    const getRowModelNo = (row: any, rawRow?: any[]): string | undefined => {
      if (useColCForModel && rawRow && rawRow[2] !== undefined && rawRow[2] !== null && String(rawRow[2]).trim() !== '') {
        return String(rawRow[2]).trim();
      }
      return getField(row, ['Model No', 'ModelNo', 'model']);
    };

    const getRowMmCode = (row: any, rawRow?: any[]): string | undefined => {
      let raw: string | undefined;
      if (useColJForMmCode && rawRow && rawRow[9] !== undefined && rawRow[9] !== null && String(rawRow[9]).trim() !== '') {
        raw = String(rawRow[9]).trim();
      } else {
        raw = getField(row, ['MM CODE', 'mm_code', 'MMCODE']);
      }
      return (raw && /^\d{6}\//.test(raw)) ? raw.substring(7).trim() : raw?.trim();
    };

    // Pre-cache parent products that were created in previous imports
    const allSkuModelNos = skuRows.map((r, idx) => getRowModelNo(r, rawSkuRows[idx + 1])).filter(Boolean) as string[];
    const missingModelNos = Array.from(new Set(allSkuModelNos.filter(m => !parentProductsMap.has(m.toLowerCase().trim()))));
    if (missingModelNos.length > 0) {
      try {
        const dbMatches = await productsCollection.find(
          { name: { $in: missingModelNos } },
          { projection: { _id: 1, name: 1, specifications: 1 } }
        ).toArray();
        dbMatches.forEach((p: any) => {
          const pid = String(p._id);
          parentProductsMap.set(String(p.name).toLowerCase().trim(), pid);
          parentProductNamesMap.set(pid, String(p.name));
          if (p.specifications) productSpecsByIdMap.set(pid, p.specifications);
        });
      } catch (e) {
        // Fallback
      }
    }

    // Pre-cache existing SKUs in a single native MongoDB query
    const allMmCodes = Array.from(
      new Set(
        skuRows
          .map((r, idx) => getRowMmCode(r, rawSkuRows[idx + 1]))
          .filter(Boolean) as string[]
      )
    );

    const existingSkusMap = new Map<string, any>();
    if (allMmCodes.length > 0) {
      try {
        const existingSkus = await skusCollection.find(
          { name: { $in: allMmCodes } },
          { projection: { _id: 1, name: 1 } }
        ).toArray();
        existingSkus.forEach((s: any) => {
          if (s.name) existingSkusMap.set(String(s.name).toLowerCase().trim(), s);
        });
      } catch (e) {
        // Fallback
      }
    }

    // Format CCT from General Data (e.g. 3000400050006500 -> 3000/4000/5000/6500K)
    const formatGeneralCct = (rawCct: any): string => {
      if (!rawCct) return '';
      const str = String(rawCct).trim();
      if (/^\d{8,16}$/.test(str) && str.length % 4 === 0) {
        const parts = [];
        for (let k = 0; k < str.length; k += 4) {
          parts.push(str.substring(k, k + 4));
        }
        return parts.join('/') + 'K';
      }
      if (/^\d{4}$/.test(str)) {
        return str + 'K';
      }
      return str;
    };

    const skuBulkOps: any[] = [];
    const now = new Date();

    for (let i = 0; i < skuRows.length; i++) {
      const row = skuRows[i];
      const rawRow = rawSkuRows[i + 1];
      const rowNum = i + 2;

      const modelNoVariant = getRowModelNo(row, rawRow);
      const colour = getField(row, ['Luminaires color', 'Colour', 'Color', '灯具颜色']);
      const specialFeatures = getField(row, ['Special features', '灯特色']);
      const watt = getField(row, ['watt', 'Wattage']);
      const lampBase = getField(row, ['Lamp base', 'lamp base']);
      const colourTemp = getField(row, ['Colortemp.', 'Color Temp', 'colour_temp']);
      const mmCode = getRowMmCode(row, rawRow);
      const voltage = getField(row, ['Voltage', 'voltage']);
      const connector = getField(row, ['Connector', 'Terminal Block', '端子台']);
      const ip = getField(row, ['IPXX', 'IP']);
      let packing = getField(row, ['packing method', 'update packing method']);
      const ean = getField(row, ['EAN13 barcode', 'barcode']);
      const innerItf = getField(row, ['Inner box ITF14', 'inner_itf']);
      const outerItf = getField(row, ['Outer box ITF14', 'outer_itf']);

      let remark = getField(row, ['备注']);
      const remarkField = getField(row, ['Remark']);
      if (remarkField) {
        const isPackingLike = /pcs|盒|箱|box|pack/i.test(remarkField) || /\d+\s*pcs/i.test(remarkField);
        if (isPackingLike && !packing) {
          packing = remarkField;
        } else {
          if (!remark) {
            remark = remarkField;
          } else {
            remark = `${remark} (Remark: ${remarkField})`;
          }
        }
      }

      if (!mmCode) {
        warnings.push(`SKU Row ${rowNum}: Skipped because "MM CODE" is missing.`);
        continue;
      }

      if (!modelNoVariant) {
        warnings.push(`SKU Row ${rowNum} (${mmCode}): Skipped because "Model No" (Parent Match) is missing.`);
        continue;
      }

      // Rule 1: "there are no rows related with the products start with XCD, so nothing to match."
      if (/^xcd/i.test(modelNoVariant.trim())) {
        logs.push(`SKU Row ${rowNum} (${mmCode}): Model "${modelNoVariant}" starts with XCD. Per business rule, products starting with XCD have no rows in product MM code and are not matched.`);
        continue;
      }

      // Rule 2: "Column I of the general data is indexing column C of product mm code. if this 2 cells are same, please use the mm code on column J in product mm code"
      const exactModelKey = modelNoVariant.trim().toLowerCase();
      const parentProductId = parentProductsMap.get(exactModelKey);
      const parentProductName = parentProductId ? parentProductNamesMap.get(parentProductId) : '';

      if (!parentProductId) {
        warnings.push(`SKU Row ${rowNum} (${mmCode}): Column C "${modelNoVariant}" does not match Column I of any General Data product. Skipped SKU.`);
        continue;
      }

      logs.push(`Processing SKU variant "${mmCode}" linking to parent model "${modelNoVariant}"...`);

      // Find the matching specifications row (disambiguating by colour when multiple General Data rows share the same model number)
      let matchingSpecs: any = findBestMatchingSpec(generalSpecsListMap.get(exactModelKey), colour)
        || productSpecsByIdMap.get(parentProductId)
        || null;

      if (matchingSpecs) {
        logs.push(`Found specifications for SKU "${mmCode}" (Model: "${modelNoVariant}").`);
      }

      // USE GENERAL DATA AS THE CORRECT DATA (General Data takes precedence)
      const finalWattage = (matchingSpecs?.on_mode_power_w ? String(matchingSpecs.on_mode_power_w) : '')
        || watt
        || undefined;

      const generalCctFormatted = matchingSpecs?.cct_k ? formatGeneralCct(matchingSpecs.cct_k) : '';
      const finalColourTemp = generalCctFormatted || colourTemp || undefined;

      const generalColor = extractGeneralColor(matchingSpecs);
      // If table colour is actually a CCT (e.g. 3000/4000/6500K) or missing, ignore it
      const isColourActuallyCct = colour ? /^\d{4}/.test(String(colour).trim()) : false;
      const finalColour = generalColor || (!isColourActuallyCct ? colour : undefined) || undefined;

      const finalVoltage = (matchingSpecs?.rated_voltage_v ? String(matchingSpecs.rated_voltage_v) : '')
        || voltage
        || undefined;

      const finalIp = (matchingSpecs?.ip || matchingSpecs?.ip_rating ? String(matchingSpecs.ip || matchingSpecs.ip_rating) : '')
        || ip
        || undefined;

      const finalPacking = (matchingSpecs?.packaging ? String(matchingSpecs.packaging) : '')
        || packing
        || undefined;

      const finalLampBase = (matchingSpecs?.cap_type || matchingSpecs?.lamp_holder_type || matchingSpecs?.lamp_source ? String(matchingSpecs.cap_type || matchingSpecs.lamp_holder_type || matchingSpecs.lamp_source) : '')
        || lampBase
        || undefined;

      const finalConnector = (matchingSpecs?.['type_terminal block'] || matchingSpecs?.control_gear || matchingSpecs?.driver_type || matchingSpecs?.dimming_type ? String(matchingSpecs?.['type_terminal block'] || matchingSpecs?.control_gear || matchingSpecs?.driver_type || matchingSpecs?.dimming_type) : '')
        || connector
        || undefined;

      // Photometry file auto-matching from ZIP (only if files exist)
      const hasZipFiles = filesMap.size > 0;
      const ldtId = hasZipFiles ? await uploadAssetFromZip(undefined, [`${mmCode}.ldt`, `${modelNoVariant}.ldt`], `LDT Photometrics for ${mmCode}`, 'document') : null;
      const iesId = hasZipFiles ? await uploadAssetFromZip(undefined, [`${mmCode}.ies`, `${modelNoVariant}.ies`], `IES Photometrics for ${mmCode}`, 'document') : null;
      const spectrumId = hasZipFiles ? await uploadAssetFromZip(undefined, [`${mmCode}_spectrum.png`, `${mmCode}_spectrum.jpg`, `${modelNoVariant}_spectrum.png`], `Light Spectrum Graph for ${mmCode}`, 'image') : null;
      const drawingId = hasZipFiles ? await uploadAssetFromZip(undefined, [`${mmCode}_drawing.png`, `${mmCode}_drawing.jpg`, `${modelNoVariant}_drawing.png`], `Line Drawing for ${mmCode}`, 'image') : null;
      const polarId = hasZipFiles ? await uploadAssetFromZip(undefined, [`${mmCode}_polar.png`, `${mmCode}_polar.jpg`, `${modelNoVariant}_polar.png`], `Photometric Polar Diagram for ${mmCode}`, 'image') : null;
      const beamId = hasZipFiles ? await uploadAssetFromZip(undefined, [`${mmCode}_beam.png`, `${mmCode}_beam.jpg`, `${modelNoVariant}_beam.png`], `Beam Angle Diagram for ${mmCode}`, 'image') : null;

      try {
        const skuKey = mmCode.toLowerCase().trim();
        const existing = existingSkusMap.get(skuKey);

        const skuSetFields: Record<string, any> = {
          name: mmCode,
          product: toObjectId(parentProductId),
          modelNumber: parentProductName || modelNoVariant,
          colour: finalColour,
          specialFeatures: specialFeatures || undefined,
          wattage: finalWattage,
          lampBase: finalLampBase,
          colourTemperature: finalColourTemp,
          voltage: finalVoltage,
          ip: finalIp,
          connector: finalConnector,
          packingMethod: finalPacking,
          eanBarcode: ean || undefined,
          innerBoxItf: innerItf || undefined,
          outerBoxItf: outerItf || undefined,
          remark: remark || undefined,
          specifications: matchingSpecs || undefined,
          updatedAt: now,
        };

        if (ldtId) skuSetFields.photometryLdt = toObjectId(ldtId);
        if (iesId) skuSetFields.photometryIes = toObjectId(iesId);
        if (spectrumId) skuSetFields.lightSpectrumGraph = toObjectId(spectrumId);
        if (drawingId) skuSetFields.lineDrawing = toObjectId(drawingId);
        if (polarId) skuSetFields.photometricPolarDiagram = toObjectId(polarId);
        if (beamId) skuSetFields.beamAngleDiagram = toObjectId(beamId);

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

    if (skuBulkOps.length > 0) {
      await skusCollection.bulkWrite(skuBulkOps, { ordered: false });
    }
  } else {
    logs.push('No SKU MM Code spreadsheet provided. SKU variant import phase will be skipped.');
  }

  // Synchronize family-to-product relationships (only families touched by this import)
  logs.push(`Synchronizing family-to-product relationships for ${touchedFamilyIds.size} famil${touchedFamilyIds.size === 1 ? 'y' : 'ies'}...`);
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

      // Remove any accessory IDs from main products list so accessories only appear in "Accessories / Optional Parts"
      const mergedProducts = new Set<string>(currentProductIds.filter(id => !mergedAccessories.has(id)));
      for (const p of familyProducts) {
        const pid = String(p._id);
        if (!mergedAccessories.has(pid)) {
          mergedProducts.add(pid);
        }
      }

      const nextProductsArr = Array.from(mergedProducts);
      const nextAccessoriesArr = Array.from(mergedAccessories);
      const productsUnchanged =
        nextProductsArr.length === currentProductIds.length &&
        nextProductsArr.every((id, idx) => id === currentProductIds[idx]);
      const accessoriesUnchanged =
        nextAccessoriesArr.length === currentAccessoryIds.length &&
        nextAccessoriesArr.every((id, idx) => id === currentAccessoryIds[idx]);

      if (productsUnchanged && accessoriesUnchanged) {
        logs.push(`Family "${(familyDoc as any).name}" already up to date (${mergedProducts.size} products, ${mergedAccessories.size} accessories).`);
        continue;
      }

      await familiesCollection.updateOne(
        { _id: famObjId },
        {
          $set: {
            products: nextProductsArr.map(id => toObjectId(id)),
            accessoryProducts: nextAccessoriesArr.map(id => toObjectId(id)),
            updatedAt: new Date(),
          },
        }
      );
      logs.push(`Synchronized family "${(familyDoc as any).name}" (${mergedProducts.size} products, ${mergedAccessories.size} accessories).`);
    } catch (err: any) {
      warnings.push(`Could not synchronize family "${familyId}" with products: ${err.message}`);
    }
  }

  logs.push(`SKU Bulk import completed: Products (Created: ${productsCreated}, Updated: ${productsUpdated}), SKUs (Created: ${skusCreated}, Updated: ${skusUpdated}).`);

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
