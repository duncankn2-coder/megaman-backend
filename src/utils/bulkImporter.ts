import { Payload } from 'payload';
import * as xlsx from 'xlsx';
import AdmZip from 'adm-zip';
import path from 'path';

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  warnings: string[];
  logs: string[];
}

export async function processBulkImport(
  payload: Payload,
  xlsxBuffer: Buffer,
  zipBuffer: Buffer
): Promise<ImportResult> {
  const warnings: string[] = [];
  const logs: string[] = [];
  let createdCount = 0;
  let updatedCount = 0;

  logs.push('Initializing ZIP archive parser...');
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch (error: any) {
    throw new Error(`Failed to parse ZIP file: ${error.message}`);
  }

  // Get all files from ZIP with their paths
  const zipEntries = zip.getEntries();
  logs.push(`Found ${zipEntries.length} file entries in the ZIP archive.`);

  // Create a map of filename (lowercase) to ZIP entry
  const filesMap = new Map<string, AdmZip.IZipEntry>();
  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    // Extract base filename
    const filename = path.basename(entry.entryName).toLowerCase();
    filesMap.set(filename, entry);
  }

  logs.push('Parsing Excel spreadsheet...');
  let workbook: xlsx.WorkBook;
  try {
    workbook = xlsx.read(xlsxBuffer, { type: 'buffer' });
  } catch (error: any) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Spreadsheet does not contain any sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<any>(sheet);
  logs.push(`Found ${rows.length} rows in the first sheet "${sheetName}".`);

  if (rows.length === 0) {
    return { success: true, created: 0, updated: 0, warnings: ['Excel sheet is empty.'], logs };
  }

  // Column header mappings (flexible lookup)
  const getField = (row: any, candidates: string[]): string | undefined => {
    for (const cand of candidates) {
      if (row[cand] !== undefined && row[cand] !== null) {
        return String(row[cand]).trim();
      }
      // Check lowercase / whitespace variation
      for (const key of Object.keys(row)) {
        if (key.trim().toLowerCase() === cand.toLowerCase()) {
          return String(row[key]).trim();
        }
      }
    }
    return undefined;
  };

  // Process rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Row number in Excel sheet (1-based index + header)

    const modelNumber = getField(row, ['Model Number', 'ModelNumber', 'SKU', 'Name', 'model_number', 'model']);
    const description = getField(row, ['Description', 'desc', 'details']) || '';
    const categoryName = getField(row, ['Category', 'cat']);
    const familyName = getField(row, ['Family', 'fam']);
    const color = getField(row, ['Color', 'Colour', 'color', 'colour']);
    const power = getField(row, ['Power', 'power_w', 'watts']);
    const colorTemp = getField(row, ['Color Temperature', 'Colour Temperature', 'CCT', 'cct']);

    const imageFile = getField(row, ['Image File', 'ImageFile', 'Image', 'image_file', 'img']);
    const datasheetPdfFile = getField(row, ['Datasheet PDF File', 'DatasheetPDFFile', 'PDF', 'datasheet_pdf', 'datasheet', 'pdf']);
    const ldtFile = getField(row, ['LDT File', 'LDTFile', 'LDT', 'ldt_file', 'ldt']);
    const iesFile = getField(row, ['IES File', 'IESFile', 'IES', 'ies_file', 'ies']);
    const techDocControlGearFile = getField(row, ['Technical Document - Control Gear', 'Technical Document Control Gear', 'TechnicalDocumentControlGear', 'tech_doc_control_gear', 'control_gear_doc']);
    const techDocContainingProductFile = getField(row, ['Technical Document - Containing Product', 'Technical Document Containing Product', 'TechnicalDocumentContainingProduct', 'tech_doc_containing_product', 'containing_product_doc']);
    const techDocLightSourceFile = getField(row, ['Technical Document - Light Source', 'Technical Document Light Source', 'TechnicalDocumentLightSource', 'tech_doc_light_source', 'light_source_doc']);
    const dismantleInstructionFile = getField(row, ['Dismantle Instruction PDF', 'Dismantle Instruction', 'DismantleInstruction', 'dismantle_instruction_pdf', 'di_pdf']);

    if (!modelNumber) {
      warnings.push(`Row ${rowNum}: Skipped because "Model Number" is missing.`);
      continue;
    }

    if (!categoryName) {
      warnings.push(`Row ${rowNum} (${modelNumber}): Skipped because "Category" is missing.`);
      continue;
    }

    logs.push(`Processing row ${rowNum}: Product model "${modelNumber}"...`);

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

      // If not specified or not found directly, try fallback patterns from ZIP
      if (!zipEntry) {
        for (const pattern of fallbackPatterns) {
          const tryName = pattern.toLowerCase();
          const entry = filesMap.get(tryName);
          if (entry) {
            zipEntry = entry;
            cleanName = path.basename(entry.entryName);
            logs.push(`Found file via auto-matching naming convention: "${cleanName}"`);
            break;
          }
        }
      }

      if (!zipEntry) {
        if (cleanName) {
          warnings.push(`Row ${rowNum} (${modelNumber}): File "${cleanName}" not found in ZIP archive.`);
        }
        return null;
      }

      const fileBuffer = zipEntry.getData();
      const size = fileBuffer.length;
      
      // Determine mimetype
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
        logs.push(`Uploaded asset "${cleanName}" as media record (ID: ${mediaDoc.id}).`);
        return mediaDoc.id;
      } catch (err: any) {
        warnings.push(`Row ${rowNum} (${modelNumber}): Failed to upload file "${cleanName}". Error: ${err.message}`);
        return null;
      }
    };

    // Generate normalized variations of the model number to handle slashes converted to other characters in filenames
    const normalizedModels = Array.from(new Set([
      modelNumber,
      modelNumber.replace(/\//g, '-'),
      modelNumber.replace(/\//g, '_'),
      modelNumber.replace(/\//g, ' '),
      modelNumber.replace(/\//g, '-').replace(/-/g, ' '),
    ])).filter(Boolean);

    const fallbackImages: string[] = [];
    for (const m of normalizedModels) {
      fallbackImages.push(`${m}.png`, `${m}.jpg`, `${m}.jpeg`, `${m}.gif`);
    }

    const fallbackDatasheets: string[] = [];
    for (const m of normalizedModels) {
      fallbackDatasheets.push(`${m}.pdf`, `${m}_datasheet.pdf`, `${m}_spec.pdf`, `${m}_leaflet.pdf`);
    }

    const fallbackLdts: string[] = [];
    for (const m of normalizedModels) {
      fallbackLdts.push(`${m}.ldt`);
    }

    const fallbackIess: string[] = [];
    for (const m of normalizedModels) {
      fallbackIess.push(`${m}.ies`);
    }

    const fallbackControlGears: string[] = [];
    for (const m of normalizedModels) {
      fallbackControlGears.push(`${m}_control_gear.pdf`, `${m}_cg.pdf`);
    }

    const fallbackContainingProducts: string[] = [];
    for (const m of normalizedModels) {
      fallbackContainingProducts.push(`${m}_containing_product.pdf`, `${m}_cp.pdf`);
    }

    const fallbackLightSources: string[] = [];
    for (const m of normalizedModels) {
      fallbackLightSources.push(`${m}_light_source.pdf`, `${m}_ls.pdf`);
    }

    // 1. Upload Primary Image (Required)
    const imageId = await uploadAssetFromZip(
      imageFile,
      fallbackImages,
      `Image for ${modelNumber}`,
      'image'
    );
    if (!imageId) {
      warnings.push(`Row ${rowNum} (${modelNumber}): Skipped because product primary image could not be resolved. Expected specified filename or ZIP auto-match like "${modelNumber}.jpg" or "${modelNumber}.png".`);
      continue;
    }

    // 2. Upload Optional Assets
    const datasheetId = await uploadAssetFromZip(
      datasheetPdfFile,
      fallbackDatasheets,
      `Datasheet for ${modelNumber}`,
      'document'
    );

    const ldtId = await uploadAssetFromZip(
      ldtFile,
      fallbackLdts,
      `LDT Photometrics for ${modelNumber}`,
      'document'
    );

    const iesId = await uploadAssetFromZip(
      iesFile,
      fallbackIess,
      `IES Photometrics for ${modelNumber}`,
      'document'
    );

    const techDocControlGearId = await uploadAssetFromZip(
      techDocControlGearFile,
      fallbackControlGears,
      `Technical Document - Control Gear for ${modelNumber}`,
      'document'
    );

    const techDocContainingProductId = await uploadAssetFromZip(
      techDocContainingProductFile,
      fallbackContainingProducts,
      `Technical Document - Containing Product for ${modelNumber}`,
      'document'
    );

    const techDocLightSourceId = await uploadAssetFromZip(
      techDocLightSourceFile,
      fallbackLightSources,
      `Technical Document - Light Source for ${modelNumber}`,
      'document'
    );

    // 3. Resolve Category (Match or Create)
    const finalCategoryIds: string[] = [];
    const catNames = categoryName.split(',').map(s => s.trim()).filter(Boolean);
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
          finalCategoryIds.push(catQuery.docs[0].id);
        } else {
          logs.push(`Category "${cName}" not found. Creating dynamically...`);
          const newCat = await payload.create({
            collection: 'categories',
            data: {
              name: cName,
            },
          });
          finalCategoryIds.push(newCat.id);
          logs.push(`Created category "${cName}".`);
        }
      } catch (err: any) {
        warnings.push(`Row ${rowNum} (${modelNumber}): Error resolving category "${cName}": ${err.message}`);
      }
    }

    if (finalCategoryIds.length === 0) {
      warnings.push(`Row ${rowNum} (${modelNumber}): Skipped because no valid Category could be assigned or created.`);
      continue;
    }

    // 4. Resolve Family (Match or Create if supplied)
    let finalFamilyId: string | null = null;
    if (familyName) {
      try {
        const cleanFamName = familyName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        const famSlugName = familyName.toLowerCase().replace(/\s+/g, '-');
        const fallbackDis = [
          `${cleanFamName}_di.pdf`,
          `${famSlugName}_di.pdf`,
          `${familyName.toLowerCase()}_di.pdf`,
          `${familyName.toLowerCase()}-di.pdf`,
        ];
        const dismantlePdfId = await uploadAssetFromZip(
          dismantleInstructionFile,
          fallbackDis,
          `Dismantle Instruction PDF for ${familyName}`,
          'document'
        );

        const famQuery = await payload.find({
          collection: 'families',
          where: {
            name: { equals: familyName },
          },
          limit: 1,
        });

        if (famQuery.docs.length > 0) {
          finalFamilyId = famQuery.docs[0].id;
          
          // Merge categories on existing family
          const existingCategories = (famQuery.docs[0].categories || []) as (string | any)[];
          const existingCatIds = existingCategories.map(c => typeof c === 'object' ? c.id : c);
          const unionCatIds = Array.from(new Set([...existingCatIds, ...finalCategoryIds]));
          
          const updateFamData: any = {
            categories: unionCatIds,
          };
          if (dismantlePdfId && !famQuery.docs[0].dismantleInstructionPdf) {
            updateFamData.dismantleInstructionPdf = dismantlePdfId;
          }

          await payload.update({
            collection: 'families',
            id: finalFamilyId,
            data: updateFamData,
          });
        } else {
          logs.push(`Family "${familyName}" not found. Creating dynamically...`);
          // Pass the product's primary image to satisfy 'media' required option
          const newFamData: any = {
            name: familyName,
            description: `A collection of premium Megaman ${familyName} products.`,
            media: [imageId],
            categories: finalCategoryIds,
          };
          if (dismantlePdfId) {
            newFamData.dismantleInstructionPdf = dismantlePdfId;
          }

          const newFam = await payload.create({
            collection: 'families',
            data: newFamData,
          });
          finalFamilyId = newFam.id;
          logs.push(`Created family "${familyName}".`);
        }
      } catch (err: any) {
        warnings.push(`Row ${rowNum} (${modelNumber}): Error resolving family "${familyName}": ${err.message}`);
      }
    }

    // 5. Product Creation or Overwrite Update
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
        description: description,
        images: imageId,
        colour: color || undefined,
        power: power || undefined,
        colourTemperature: colorTemp || undefined,
      };

      if (finalFamilyId) {
        productData.families = finalFamilyId;
      }
      if (datasheetId) {
        productData.datasheetPdf = datasheetId;
      }
      if (ldtId) {
        productData.photometryLdt = ldtId;
      }
      if (iesId) {
        productData.photometryIes = iesId;
      }
      if (techDocControlGearId) {
        productData.techDocControlGear = techDocControlGearId;
      }
      if (techDocContainingProductId) {
        productData.techDocContainingProduct = techDocContainingProductId;
      }
      if (techDocLightSourceId) {
        productData.techDocLightSource = techDocLightSourceId;
      }

      if (existingProducts.docs.length > 0) {
        const prevDoc = existingProducts.docs[0];
        logs.push(`Product SKU "${modelNumber}" already exists (ID: ${prevDoc.id}). Overwriting parameters...`);
        
        await payload.update({
          collection: 'products',
          id: prevDoc.id,
          data: productData,
        });
        
        updatedCount++;
        logs.push(`Successfully updated Product SKU "${modelNumber}".`);
      } else {
        logs.push(`Creating new Product SKU "${modelNumber}"...`);
        
        await payload.create({
          collection: 'products',
          data: productData,
        });
        
        createdCount++;
        logs.push(`Successfully created Product SKU "${modelNumber}".`);
      }
    } catch (err: any) {
      warnings.push(`Row ${rowNum} (${modelNumber}): Failed to create/update Product. Error: ${err.message}`);
    }
  }

  logs.push(`Bulk import completed: ${createdCount} created, ${updatedCount} updated.`);
  return {
    success: true,
    created: createdCount,
    updated: updatedCount,
    warnings,
    logs,
  };
}
