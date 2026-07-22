import { Payload } from 'payload';
import * as xlsx from 'xlsx';
import AdmZip from 'adm-zip';
import path from 'path';
import { processXlsxToJson, findHeadersRowIndex } from './xlsxToJsonConverter';

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
    .replace(/v\d+/g, '') // remove version numbers
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

    const idxModelNo = findColIndex(genHeaders, [
      'customer_model_no_new',
      'Customer Model No.  (NEW ErP)',
      'Customer Model No.(NEW ErP)',
      'New ErP Model No.',
      'New ErP Model No',
      'model_number',
      'Model Number',
      'Customer Model No.(new)',
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

      // Category match
      const categoryIds: string[] = [];
      if (categoryName) {
        const query = await payload.find({
          collection: 'categories',
          where: { name: { equals: categoryName } },
          limit: 1,
        });
        if (query.docs.length > 0) {
          categoryIds.push(query.docs[0].id);
        } else {
          const newCat = await payload.create({
            collection: 'categories',
            data: { name: categoryName },
          });
          categoryIds.push(newCat.id);
        }
      }

      // Family match
      let familyId: string | null = null;
      if (familyName) {
        try {
          const query = await payload.find({
            collection: 'families',
            where: { name: { equals: familyName } },
            limit: 1,
          });
          if (query.docs.length > 0) {
            familyId = query.docs[0].id;
          } else {
            const familyImageId = imageId || placeholderImageId;
            const newFam = await payload.create({
              collection: 'families',
              data: {
                name: familyName,
                description: `A collection of premium Megaman ${familyName} products.`,
                media: familyImageId ? [familyImageId] : [],
                categories: categoryIds,
              },
            });
            familyId = newFam.id;
          }
        } catch (err: any) {
          warnings.push(`Failed to resolve or create family "${familyName}": ${err.message}`);
        }
      }

      // Upsert Product record
      try {
        const query = await payload.find({
          collection: 'products',
          where: { name: { equals: modelNo } },
          limit: 1,
        });

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

        const finalProductImage = imageId || placeholderImageId;
        if (finalProductImage) productData.images = finalProductImage;
        if (familyId) productData.families = familyId;

        if (query.docs.length > 0) {
          const existing = query.docs[0];
          await payload.update({
            collection: 'products',
            id: existing.id,
            data: productData,
          });
          parentProductsMap.set(normalizeModelNumber(modelNo), existing.id);
          parentProductNamesMap.set(existing.id, modelNo);
          productsUpdated++;
        } else {
          const created = await payload.create({
            collection: 'products',
            data: productData,
          });
          parentProductsMap.set(normalizeModelNumber(modelNo), created.id);
          parentProductNamesMap.set(created.id, modelNo);
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

      // Attempt to match parent product
      let parentProductId = parentProductsMap.get(normalizeModelNumber(modelNoVariant));
      
      // Fallback: search parentProductsMap using cleanModel
      if (!parentProductId) {
        const cleanVar = cleanModel(modelNoVariant);
        for (const [key, val] of parentProductsMap.entries()) {
          if (cleanModel(key) === cleanVar) {
            parentProductId = val;
            break;
          }
        }
      }

      let parentProductName = parentProductId ? parentProductNamesMap.get(parentProductId) : '';
      
      if (!parentProductId) {
        // Direct lookup from database in case it was created previously
        const dbMatch = await payload.find({
          collection: 'products',
          where: { name: { equals: modelNoVariant } },
          limit: 1,
        });
        if (dbMatch.docs.length > 0) {
          parentProductId = dbMatch.docs[0].id;
          parentProductName = dbMatch.docs[0].name;
        } else {
          // Fuzzy DB lookup
          const allProducts = await payload.find({
            collection: 'products',
            limit: 1000,
          });
          // Try normalized match first
          let matched = allProducts.docs.find(
            p => normalizeModelNumber(p.name) === normalizeModelNumber(modelNoVariant)
          );
          // Fallback to clean match
          if (!matched) {
            const cleanVar = cleanModel(modelNoVariant);
            matched = allProducts.docs.find(
              p => cleanModel(p.name) === cleanVar
            );
          }
          if (matched) {
            parentProductId = matched.id;
            parentProductName = matched.name;
          }
        }
      } else if (!parentProductName) {
        // If parentProductId is found but parentProductName is not in map (e.g. not created in this run), fetch it
        try {
          const parentProd = await payload.findByID({
            collection: 'products',
            id: parentProductId,
          });
          parentProductName = parentProd.name;
        } catch (err) {
          // Ignore and fallback
        }
      }

      if (!parentProductId) {
        warnings.push(`SKU Row ${rowNum} (${mmCode}): Warning — could not link to parent base product "${modelNoVariant}". Skipped SKU.`);
        continue;
      }

      logs.push(`Processing SKU variant "${mmCode}" linking to parent model "${modelNoVariant}"...`);

      // Find the matching specifications row from the General Data Excel
      const cctClean = colourTemp ? String(colourTemp).replace(/[^\d]/g, '') : '';
      let matchingSpecs: any = null;
      if (generalSpecs.length > 0) {
        matchingSpecs = generalSpecs.find(specs => 
          specs && 
          normalizeModelNumber(specs.customer_model_no_new) === normalizeModelNumber(modelNoVariant) &&
          (specs.cct_k ? String(specs.cct_k).replace(/[^\d]/g, '') === cctClean : false)
        );
        if (matchingSpecs) {
          logs.push(`Found variant-specific specifications for SKU "${mmCode}" (CCT: ${cctClean}K).`);
        }
      }

      // Photometry file auto-matching from ZIP
      const ldtId = await uploadAssetFromZip(undefined, [`${mmCode}.ldt`, `${modelNoVariant}.ldt`], `LDT Photometrics for ${mmCode}`, 'document');
      const iesId = await uploadAssetFromZip(undefined, [`${mmCode}.ies`, `${modelNoVariant}.ies`], `IES Photometrics for ${mmCode}`, 'document');

      try {
        const query = await payload.find({
          collection: 'skus',
          where: { name: { equals: mmCode } },
          limit: 1,
        });

        const skuData: any = {
          name: mmCode,
          product: parentProductId,
          modelNumber: parentProductName || modelNoVariant,
          colour: colour || undefined,
          specialFeatures: specialFeatures || undefined,
          wattage: watt || undefined,
          lampBase: lampBase || undefined,
          colourTemperature: colourTemp || undefined,
          voltage: voltage || undefined,
          connector: connector || undefined,
          ip: ip || undefined,
          packingMethod: packing || undefined,
          eanBarcode: ean || undefined,
          innerBoxItf: innerItf || undefined,
          outerBoxItf: outerItf || undefined,
          remark: remark || undefined,
          specifications: matchingSpecs || undefined,
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
