import { Payload } from 'payload';
import * as xlsx from 'xlsx';
import AdmZip from 'adm-zip';
import path from 'path';
import { getMongoClient } from './mongoClient';
import { cleanValue } from './xlsxToJsonConverter';

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

  const parentProductsMap = new Map<string, string>(); // modelNumber -> ProductID
  const parentProductNamesMap = new Map<string, string>(); // productID -> originalName

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

    // Sync specs to MongoDB
    if (lightSourceCollection) {
      try {
        await lightSourceCollection.updateOne(
          { mm_code: mmCode },
          { $set: specRecord },
          { upsert: true }
        );
      } catch (err: any) {
        warnings.push(`Failed to sync specs to MongoDB for MM Code "${mmCode}": ${err.message}`);
      }
    }

    // Handle Category resolution
    const catName1 = idxCategory1 !== -1 ? String(row[idxCategory1] || '').trim() : '';
    const catName2 = idxCategory2 !== -1 ? String(row[idxCategory2] || '').trim() : '';
    const categoryNames = [catName1, catName2].filter(c => c && c.toLowerCase() !== 'n/a' && c !== '-');
    const categoryIds: string[] = [];

    for (const catName of categoryNames) {
      const query = await payload.find({
        collection: 'categories',
        where: { name: { equals: catName } },
        limit: 1,
      });
      if (query.docs.length > 0) {
        categoryIds.push(query.docs[0].id as string);
      } else {
        const newCat = await payload.create({
          collection: 'categories',
          data: { name: catName },
        });
        categoryIds.push(newCat.id as string);
      }
    }

    // Resolve Image from ZIP
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
    const cleanMmForLookup = mmCode.replace(/\//g, '-').replace(/\s+/g, '');
    imageFallbacks.unshift(`${cleanMmForLookup}.png`, `${cleanMmForLookup}.jpg`, `${cleanMmForLookup}.jpeg`);

    const imageId = await uploadAssetFromZip(undefined, imageFallbacks, `Image for ${modelNo}`, 'image');

    // Resolve Family (Series)
    const familyName = idxFamily !== -1 ? String(row[idxFamily] || '').trim() : '';
    let familyId: string | null = null;
    if (familyName && familyName.toLowerCase() !== 'n/a' && familyName !== '-') {
      try {
        const query = await payload.find({
          collection: 'families',
          where: { name: { equals: familyName } },
          limit: 1,
        });
        if (query.docs.length > 0) {
          familyId = query.docs[0].id as string;
        } else {
          const familyImageId = imageId || placeholderImageId;
          const newFam = await payload.create({
            collection: 'families',
            data: {
              name: familyName,
              description: `A collection of premium Megaman ${familyName} light sources.`,
              media: familyImageId ? [familyImageId] : [],
              categories: categoryIds,
            },
          });
          familyId = newFam.id as string;
        }
      } catch (err: any) {
        warnings.push(`Failed to resolve or create family "${familyName}": ${err.message}`);
      }
    }

    // Resolve Parent Product
    let parentProductId = parentProductsMap.get(normalizedModel);
    if (!parentProductId) {
      // Look up in database
      const dbMatch = await payload.find({
        collection: 'products',
        where: { name: { equals: modelNo } },
        limit: 1,
      });

      const desc = idxDescription !== -1 ? String(row[idxDescription] || '').trim() : '';
      const productData: any = {
        name: modelNo,
        description: desc || undefined,
        specifications: specRecord,
      };
      const finalProductImage = imageId || placeholderImageId;
      if (finalProductImage) productData.images = finalProductImage;
      if (familyId) productData.families = familyId;

      if (dbMatch.docs.length > 0) {
        const existing = dbMatch.docs[0];
        await payload.update({
          collection: 'products',
          id: existing.id,
          data: productData,
        });
        parentProductId = existing.id as string;
        productsUpdated++;
      } else {
        const created = await payload.create({
          collection: 'products',
          data: productData,
        });
        parentProductId = created.id as string;
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

    const ldtId = await uploadAssetFromZip(undefined, [`${cleanMmForLookup}.ldt`, `${normalizedModel}.ldt`], `LDT Photometrics for ${mmCode}`, 'document');
    const iesId = await uploadAssetFromZip(undefined, [`${cleanMmForLookup}.ies`, `${normalizedModel}.ies`], `IES Photometrics for ${mmCode}`, 'document');

    try {
      const query = await payload.find({
        collection: 'skus',
        where: { name: { equals: mmCode } },
        limit: 1,
      });

      const skuData: any = {
        name: mmCode,
        product: parentProductId,
        modelNumber: modelNo,
        colour: colour || undefined,
        specialFeatures: productCode || undefined,
        wattage: wattage || undefined,
        lampBase: lampBase || undefined,
        colourTemperature: colourTemp || undefined,
        voltage: voltage || undefined,
        specifications: specRecord,
      };

      if (ldtId) skuData.photometryLdt = ldtId;
      if (iesId) skuData.photometryIes = iesId;

      if (query.docs.length > 0) {
        const existing = query.docs[0];
        await payload.update({
          collection: 'skus',
          id: existing.id,
          data: skuData,
        });
        skusUpdated++;
      } else {
        await payload.create({
          collection: 'skus',
          data: skuData,
        });
        skusCreated++;
      }
    } catch (err: any) {
      warnings.push(`SKU Error for "${mmCode}": ${err.message}`);
    }
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
