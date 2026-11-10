import { Payload } from 'payload';
import * as xlsx from 'xlsx';
import AdmZip from 'adm-zip';
import path from 'path';
import { processXlsxToJson, findHeadersRowIndex } from './xlsxToJsonConverter';
import { fetchSpecifications } from './fetchSpecifications';
import { getMongoClient } from './mongoClient';

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
  let generalSpecs: any[] = [];

  // ==========================================
  // PHASE 1: Parse General Data & Create Parent Products
  // ==========================================
  if (generalXlsxBuffer && generalXlsxBuffer.length > 0) {
    logs.push('Parsing General Data using schema converter...');
    try {
      generalSpecs = await processXlsxToJson(generalXlsxBuffer);
      logs.push(`Successfully parsed ${generalSpecs.length} specification rows using schema converter.`);

      // Connect to MongoDB to sync generalSpecs to general_data.luminaire
      try {
        const mongoClient = await getMongoClient();
        const db = mongoClient.db('general_data');
        const luminaireCollection = db.collection('luminaire');
        logs.push('Connected to general_data MongoDB database for syncing specifications.');

        if (generalSpecs.length > 0) {
          logs.push(`Syncing ${generalSpecs.length} specification rows to MongoDB...`);
            const bulkOps = generalSpecs
              .map(spec => {
                const modelNumber = spec.customer_model_no_new || spec.yk_model_no;
                if (!modelNumber) return null;
                const cleanItem = { ...spec };
                delete cleanItem._id;
                return {
                  updateOne: {
                    filter: { customer_model_no_new: modelNumber },
                    update: { $set: cleanItem },
                    upsert: true,
                  },
                };
              })
              .filter(Boolean);

            if (bulkOps.length > 0) {
              await luminaireCollection.bulkWrite(bulkOps as any, { ordered: false });
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
      const idxShape = findColIndex(genHeaders, ['shape', '形状']);
      const idxDimensions = findColIndex(genHeaders, ['dimensions', 'height (h)', 'width (w)', 'depth (d)', 'diameter_mm']);
      const idxHousingMaterial = findColIndex(genHeaders, ['housing_material', 'housing material', 'material', '外壳材质']);
      const idxCoverMaterial = findColIndex(genHeaders, ['diffuser_material', 'cover_material', 'cover material', 'cover finish', 'cover design', '透光罩材质']);
      const idxBeamAngle = findColIndex(genHeaders, ['beam_angle', 'beam angle', 'beam', '光束角']);
      const idxWattage = findColIndex(genHeaders, ['on_mode_power_w', 'on mode power', 'on-mode power', 'wattage', 'watt', 'power', '工作功率']);
      const idxInputVoltage = findColIndex(genHeaders, ['rated_voltage_v', 'input_voltage', 'voltage', 'voltage map', '额定电压']);
      const idxDimmingType = findColIndex(genHeaders, ['dimming_type', 'dimming type', 'dimming', 'dimmable']);

      if (idxModelNo === -1) {
        throw new Error('Could not find Model Number column in General Data Excel.');
      }

      // In-memory caches to prevent repeated DB round-trips
      const familyCache = new Map<string, any>(); // familyName.toLowerCase() -> familyDoc
      const categoryCache = new Map<string, string>(); // categoryName.toLowerCase() -> categoryId
      try {
        const existingFams = await payload.find({ collection: 'families', limit: 1000 });
        existingFams.docs.forEach((f: any) => familyCache.set(f.name.toLowerCase().trim(), f));
        const existingCats = await payload.find({ collection: 'categories', limit: 1000 });
        existingCats.docs.forEach((c: any) => categoryCache.set(c.name.toLowerCase().trim(), c.id));
      } catch (e) {
        // Fallback
      }

      const allGenModelNos = rawGeneralRows.slice(4).map(r => String(r[idxModelNo] || '').trim()).filter(m => m && m.toLowerCase() !== 'n/a');
      const existingProductsMap = new Map<string, any>();
      if (allGenModelNos.length > 0) {
        try {
          const existingProds = await payload.find({
            collection: 'products',
            where: { name: { in: allGenModelNos } },
            limit: 1000,
          });
          existingProds.docs.forEach((p: any) => existingProductsMap.set(p.name.toLowerCase().trim(), p));
        } catch (e) {
          // Fallback
        }
      }

      // Process general data rows (row index 4 onwards)
      for (let i = 4; i < rawGeneralRows.length; i++) {
        const row = rawGeneralRows[i];
        if (!row || row.length === 0) continue;

        const modelNo = String(row[idxModelNo] || '').trim();
        if (!modelNo || modelNo.toLowerCase() === 'n/a' || modelNo === 'undefined') continue;

        const desc = idxDescription !== -1 ? String(row[idxDescription] || '').trim() : '';
        const familyName = idxFamily !== -1 ? String(row[idxFamily] || '').trim() : '';
        const categoryName = idxCategory !== -1 ? String(row[idxCategory] || '').trim() : '';
        const shape = idxShape !== -1 ? String(row[idxShape] || '').trim() : '';
        const dimensions = idxDimensions !== -1 ? String(row[idxDimensions] || '').trim() : '';
        const housing = idxHousingMaterial !== -1 ? String(row[idxHousingMaterial] || '').trim() : '';
        const cover = idxCoverMaterial !== -1 ? String(row[idxCoverMaterial] || '').trim() : '';
        const beam = idxBeamAngle !== -1 ? String(row[idxBeamAngle] || '').trim() : '';
        const watt = idxWattage !== -1 ? String(row[idxWattage] || '').trim() : '';
        const voltage = idxInputVoltage !== -1 ? String(row[idxInputVoltage] || '').trim() : '';
        const dimming = idxDimmingType !== -1 ? String(row[idxDimmingType] || '').trim() : '';

        logs.push(`Processing base product model "${modelNo}"...`);

        // Normalized file lookups for primary image
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

        const imageId = await uploadAssetFromZip(undefined, imageFallbacks, `Primary image for ${modelNo}`, 'image');

        // Category match using in-memory cache
        const categoryIds: string[] = [];
        if (categoryName) {
            const catKey = categoryName.toLowerCase().trim();
            let catId = categoryCache.get(catKey);
            if (!catId) {
              const newCat = await payload.create({
                collection: 'categories',
                data: { name: categoryName },
              });
              catId = newCat.id;
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
                  familyId = famDoc.id;
                } else {
                  const cleanFamName = familyName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
                  const famSlugName = familyName.toLowerCase().replace(/\s+/g, '-');
                  const diFallbacks = [
                    `${cleanFamName}_di.pdf`,
                    `${famSlugName}_di.pdf`,
                    `${familyName.toLowerCase()}_di.pdf`,
                    `${familyName.toLowerCase()}-di.pdf`,
                  ];
                  const diPdfId = await uploadAssetFromZip(undefined, diFallbacks, `Dismantle Instruction PDF for ${familyName}`, 'document');
                  const familyImageId = imageId || placeholderImageId;
                  const newFamData: any = {
                    name: familyName,
                    description: `A collection of premium Megaman ${familyName} products.`,
                    media: familyImageId ? [familyImageId] : [],
                    categories: categoryIds,
                  };
                  if (diPdfId) newFamData.dismantleInstructionPdf = diPdfId;

                  const newFam = await payload.create({
                    collection: 'families',
                    data: newFamData,
                  });
                  familyId = newFam.id;
                  familyCache.set(famKey, newFam);
                }
              } catch (err: any) {
                warnings.push(`Failed to resolve or create family "${familyName}": ${err.message}`);
              }
            }

      // Upsert Product record using in-memory cache
      try {
              const modelKey = modelNo.toLowerCase().trim();
              const existing = existingProductsMap.get(modelKey);

              const productData: any = {
                name: modelNo,
                description: desc,
                shape: shape || undefined,
                dimensions: dimensions || undefined,
                housingMaterial: housing || undefined,
                coverMaterial: cover || undefined,
                beamAngle: beam || undefined,
                wattage: watt || undefined,
                inputVoltage: voltage || undefined,
                dimmingType: dimming || undefined,
              };

              // Find specifications
              let productSpecs: any = null;
              if (generalSpecs.length > 0) {
                productSpecs = generalSpecs.find(specs =>
            specs && specs.customer_model_no_new && specs.customer_model_no_new.toLowerCase().trim() === modelKey
                );
              }
              if (!productSpecs) {
                try {
                  productSpecs = await fetchSpecifications(modelNo);
                } catch (err) {
                  // Ignore
                }
              }
              if (productSpecs) {
                productData.specifications = productSpecs;
              }

              const finalProductImage = imageId || placeholderImageId;
              if (finalProductImage) productData.images = finalProductImage;
              if (familyId) productData.families = familyId;

                if (existing) {
                  await payload.update({
                    collection: 'products',
                    id: existing.id,
                    data: productData,
                  });
                  parentProductsMap.set(modelKey, existing.id);
                  parentProductNamesMap.set(existing.id, modelNo);
                  productsUpdated++;
                } else {
                  const created = await payload.create({
                    collection: 'products',
                    data: productData,
                  });
                  parentProductsMap.set(modelKey, created.id);
                  parentProductNamesMap.set(created.id, modelNo);
                  existingProductsMap.set(modelKey, created);
                  productsCreated++;
                }
              } catch (err: any) {
                warnings.push(`Base Product error for "${modelNo}": ${err.message}`);
              }
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
            const skuRows = xlsx.utils.sheet_to_json<any>(skuSheet);
            logs.push(`Found ${skuRows.length} SKU rows to process.`);

            // In-memory lookup map for general specifications
            const generalSpecsMap = new Map<string, any>();
            generalSpecs.forEach(s => {
              if (s.customer_model_no_new) {
                generalSpecsMap.set(s.customer_model_no_new.toLowerCase().trim(), s);
              }
            });

            // Pre-cache parent products that were created in previous imports
            const allSkuModelNos = skuRows.map(r => getField(r, ['Model No', 'ModelNo', 'model'])).filter(Boolean) as string[];
            const missingModelNos = Array.from(new Set(allSkuModelNos.filter(m => !parentProductsMap.has(m.toLowerCase().trim()))));
            if (missingModelNos.length > 0) {
              try {
                const dbMatches = await payload.find({
                  collection: 'products',
                  where: { name: { in: missingModelNos } },
                  limit: 1000,
                });
                dbMatches.docs.forEach((p: any) => {
                  parentProductsMap.set(p.name.toLowerCase().trim(), p.id);
                  parentProductNamesMap.set(p.id, p.name);
                });
              } catch (e) {
                // Fallback
              }
            }

            // Pre-cache existing SKUs in a single query
            const allMmCodes = skuRows.map(r => {
              const raw = getField(r, ['MM CODE', 'mm_code', 'MMCODE']);
              return (raw && /^\d{6}\//.test(raw)) ? raw.substring(7) : raw;
            }).filter(Boolean) as string[];

            const existingSkusMap = new Map<string, any>();
            if (allMmCodes.length > 0) {
              try {
                const existingSkus = await payload.find({
                  collection: 'skus',
                  where: { name: { in: allMmCodes } },
                  limit: 2000,
                });
                existingSkus.docs.forEach((s: any) => existingSkusMap.set(s.name.toLowerCase().trim(), s));
              } catch (e) {
                // Fallback
              }
            }

            for (let i = 0; i < skuRows.length; i++) {
              const row = skuRows[i];
              const rowNum = i + 2;

              const brand = getField(row, ['Brand', 'brand']);
              const modelNoVariant = getField(row, ['Model No', 'ModelNo', 'model']);
              const colour = getField(row, ['Luminaires color', 'Colour', 'Color', '灯具颜色']);
              const specialFeatures = getField(row, ['Special features', '灯特色']);
              const watt = getField(row, ['watt', 'Wattage']);
              const lampBase = getField(row, ['Lamp base', 'lamp base']);
              const colourTemp = getField(row, ['Colortemp.', 'Color Temp', 'colour_temp']);
              const mmCodeRaw = getField(row, ['MM CODE', 'mm_code', 'MMCODE']);
              const mmCode = (mmCodeRaw && /^\d{6}\//.test(mmCodeRaw)) ? mmCodeRaw.substring(7) : mmCodeRaw;
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
              let parentProductId = parentProductsMap.get(exactModelKey);
              let parentProductName = parentProductId ? parentProductNamesMap.get(parentProductId) : '';

              if (!parentProductId) {
                warnings.push(`SKU Row ${rowNum} (${mmCode}): Column C "${modelNoVariant}" does not match Column I of any General Data product. Skipped SKU.`);
                continue;
              }

                  logs.push(`Processing SKU variant "${mmCode}" linking to parent model "${modelNoVariant}"...`);

                  // Find the matching specifications row (instant in-memory lookup)
                  let matchingSpecs: any = generalSpecsMap.get(exactModelKey) || null;

                  // Fallback: Check parent product specifications
                  if(!matchingSpecs && parentProductId) {
                    try {
                      const parentDoc = await payload.findByID({
                        collection: 'products',
                        id: parentProductId,
                      });
                  if (parentDoc?.specifications) {
                    matchingSpecs = parentDoc.specifications;
                  }
                } catch (err: any) {
                  // Ignore
                }
              }

              if (matchingSpecs) {
                logs.push(`Found specifications for SKU "${mmCode}" (Model: "${modelNoVariant}").`);
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

                        const skuData: any = {
                          name: mmCode,
                          product: parentProductId,
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
                        };

                            if(ldtId) skuData.photometryLdt = ldtId;
                            if(iesId) skuData.photometryIes = iesId;
                            if(spectrumId) skuData.lightSpectrumGraph = spectrumId;
                            if(drawingId) skuData.lineDrawing = drawingId;
                            if(polarId) skuData.photometricPolarDiagram = polarId;
                            if(beamId) skuData.beamAngleDiagram = beamId;

                            if(existing) {
                              await payload.update({
                                collection: 'skus',
                                id: existing.id,
                                data: skuData,
                              });
                              skusUpdated++;
                            } else {
                              const created = await payload.create({
                                collection: 'skus',
                                data: skuData,
                              });
                              existingSkusMap.set(skuKey, created);
                              skusCreated++;
                          }
      } catch (err: any) {
                          warnings.push(`SKU Error for "${mmCode}": ${err.message}`);
                        }
                      }
    } else {
                      logs.push('No SKU MM Code spreadsheet provided. SKU variant import phase will be skipped.');
                    }

                    // Synchronize family-to-product relationships
                    logs.push('Synchronizing family-to-product relationships...');
                    try {
                      const allProducts = await payload.find({
                        collection: 'products',
                        limit: 10000,
                      });

                      const familyToProductsMap = new Map<string, string[]>();
                      for (const p of allProducts.docs) {
                        const familyId = typeof p.families === 'object' ? (p.families as any)?.id : p.families;
                        if (familyId) {
                          if (!familyToProductsMap.has(familyId)) {
                            familyToProductsMap.set(familyId, []);
                          }
                          familyToProductsMap.get(familyId)!.push(p.id);
                        }
                      }

                      for (const [familyId, prodIds] of familyToProductsMap.entries()) {
                        try {
                          await payload.update({
                            collection: 'families',
                            id: familyId,
                            data: {
                              products: prodIds,
                            },
                          });
                          logs.push(`Synchronized family "${familyId}" with ${prodIds.length} products.`);
                        } catch (err: any) {
                          warnings.push(`Could not synchronize family "${familyId}" with products: ${err.message}`);
                        }
                      }
                    } catch (err: any) {
                      warnings.push(`Failed to synchronize family-to-product relationships: ${err.message}`);
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
