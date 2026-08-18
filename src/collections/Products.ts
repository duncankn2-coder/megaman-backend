import { CollectionConfig } from 'payload';
import { fetchSpecifications } from '../utils/fetchSpecifications';
import { bulkImportHtml } from '../utils/bulkImportHtml';

// Products Collection
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true, // Allow anyone to read products
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  endpoints: [
    {
      path: '/bulk-import',
      method: 'get',
      handler: async (req) => {
        if (!req.user) {
          const loginUrl = `/admin/login?redirect=${encodeURIComponent('/api/products/bulk-import')}`;
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Unauthorized - Megaman Importer</title>
                <meta http-equiv="refresh" content="3;url=${loginUrl}">
                <style>
                  body { font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; color: #0f172a; }
                  .card { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; border: 1px solid rgba(226, 232, 240, 0.8); }
                  a { color: #2563eb; text-decoration: none; font-weight: 500; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>Authentication Required</h2>
                  <p>You must be logged in to access the Bulk Importer.</p>
                  <p>Redirecting to login in 3 seconds... or <a href="${loginUrl}">click here to login</a>.</p>
                </div>
              </body>
            </html>
          `, {
            status: 401,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        return new Response(bulkImportHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      },
    },
    {
      path: '/bulk-import/template',
      method: 'get',
      handler: async (req) => {
        if (!req.user) {
          return new Response('Unauthorized', { status: 401 });
        }

        const fs = await import('fs');
        const path = await import('path');

        const templatePath = path.resolve('public/importer_template.xlsx');
        if (!fs.existsSync(templatePath)) {
          return new Response('Template file not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(templatePath);
        return new Response(new Uint8Array(fileBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=importer_template.xlsx',
          },
        });
      },
    },
    {
      path: '/bulk-import',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        try {
          const { processBulkImport } = await import('../utils/bulkImporter');

          const formData = await (req as any).formData();
          const xlsxFile = formData.get('xlsx');
          const zipFile = formData.get('zip');

          if (!xlsxFile || !zipFile) {
            return new Response(JSON.stringify({ error: 'Both xlsx and zip files are required.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const xlsxBlob = xlsxFile as Blob;
          const zipBlob = zipFile as Blob;

          const xlsxBuffer = Buffer.from(await xlsxBlob.arrayBuffer());
          const zipBuffer = Buffer.from(await zipBlob.arrayBuffer());

          const result = await processBulkImport(req.payload, xlsxBuffer, zipBuffer);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('Error in bulk-import POST handler:', error);
          return new Response(JSON.stringify({ error: error.message || 'An error occurred during import' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
    {
      path: '/sku-bulk-import',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        try {
          const { processSkuBulkImport } = await import('../utils/skuBulkImporter');

          const formData = await (req as any).formData();
          const generalXlsxFile = formData.get('generalXlsx');
          const skuXlsxFile = formData.get('skuXlsx');
          const zipFile = formData.get('zip');

          const hasGeneral = generalXlsxFile instanceof Blob && generalXlsxFile.size > 0;
          const hasSku = skuXlsxFile instanceof Blob && skuXlsxFile.size > 0;
          const hasZip = zipFile instanceof Blob && zipFile.size > 0;

          if (!hasGeneral && !hasSku) {
            return new Response(JSON.stringify({ error: 'At least one General data XLSX or SKU MM Code XLSX file is required.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const generalXlsxBuffer = hasGeneral 
            ? Buffer.from(await (generalXlsxFile as Blob).arrayBuffer())
            : undefined;
          const skuXlsxBuffer = hasSku 
            ? Buffer.from(await (skuXlsxFile as Blob).arrayBuffer())
            : undefined;
          const zipBuffer = hasZip
            ? Buffer.from(await (zipFile as Blob).arrayBuffer())
            : undefined;

          const result = await processSkuBulkImport(req.payload, generalXlsxBuffer, skuXlsxBuffer, zipBuffer);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('Error in sku-bulk-import POST handler:', error);
          return new Response(JSON.stringify({ error: error.message || 'An error occurred during import' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
    {
      path: '/light-source-bulk-import',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        try {
          const { processLightSourceBulkImport } = await import('../utils/lightSourceBulkImporter');

          const formData = await (req as any).formData();
          const xlsxFile = formData.get('xlsx');
          const zipFile = formData.get('zip');

          const hasXlsx = xlsxFile instanceof Blob && xlsxFile.size > 0;
          const hasZip = zipFile instanceof Blob && zipFile.size > 0;

          if (!hasXlsx) {
            return new Response(JSON.stringify({ error: 'xlsx file is required.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const xlsxBuffer = Buffer.from(await (xlsxFile as Blob).arrayBuffer());
          const zipBuffer = hasZip
            ? Buffer.from(await (zipFile as Blob).arrayBuffer())
            : undefined;

          const result = await processLightSourceBulkImport(req.payload, xlsxBuffer, zipBuffer);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('Error in light-source-bulk-import POST handler:', error);
          return new Response(JSON.stringify({ error: error.message || 'An error occurred during import' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },

    {
      path: '/json-import',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        try {
          const { processJsonImport } = await import('../utils/jsonImporter');

          const formData = await (req as any).formData();
          const jsonFile = formData.get('json');

          if (!jsonFile) {
            return new Response(JSON.stringify({ error: 'JSON file is required.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const jsonBlob = jsonFile as Blob;
          const jsonText = await jsonBlob.text();
          const jsonData = JSON.parse(jsonText);

          const result = await processJsonImport(req.payload, jsonData);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('Error in json-import POST handler:', error);
          return new Response(JSON.stringify({ error: error.message || 'An error occurred during import' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
    {
      path: '/xlsx-to-json',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        try {
          const { processXlsxToJson } = await import('../utils/xlsxToJsonConverter');

          const formData = await (req as any).formData();
          const xlsxFile = formData.get('xlsx');

          if (!xlsxFile) {
            return new Response(JSON.stringify({ error: 'XLSX file is required.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const xlsxBlob = xlsxFile as Blob;
          const xlsxBuffer = Buffer.from(await xlsxBlob.arrayBuffer());

          const result = await processXlsxToJson(xlsxBuffer);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('Error in xlsx-to-json POST handler:', error);
          return new Response(JSON.stringify({ error: error.message || 'An error occurred during conversion' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
    {
      path: '/:id/technical-document',
      method: 'get',
      handler: async (req) => {
        try {
          const { id } = req.routeParams || {};
          const url = new URL(req.url || '', 'http://localhost');
          const type = url.searchParams.get('type') || 'light-source';

          if (!id) {
            return new Response(JSON.stringify({ error: 'Product ID is required' }), { status: 400 });
          }

          // Fetch product with depth=2 to populate family and media
          const product = await req.payload.findByID({
            collection: 'products',
            id: String(id),
            depth: 2,
          });

          if (!product) {
            return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
          }

          // Resolve primary target document field
          let targetMediaField: any = null;
          if (type === 'control-gear') {
            targetMediaField = product.techDocControlGear;
          } else if (type === 'containing-product') {
            targetMediaField = product.techDocContainingProduct;
          } else if (type === 'datasheet') {
            targetMediaField = product.datasheetPdf;
          } else {
            targetMediaField = product.techDocLightSource;
          }

          // Resolve family dismantle instruction PDF
          const familyObj = typeof product.families === 'object' && product.families !== null ? product.families : null;
          const familyDiMediaField: any = familyObj?.dismantleInstructionPdf || null;

          const fs = await import('fs');
          const path = await import('path');
          const { PDFDocument } = await import('pdf-lib');

          const payloadUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL 
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

          const getMediaBuffer = async (mediaObj: any): Promise<Buffer | null> => {
            if (!mediaObj) return null;
            let filename = '';
            let mediaUrl = '';
            if (typeof mediaObj === 'object' && mediaObj !== null) {
              filename = mediaObj.filename || '';
              mediaUrl = mediaObj.url || '';
            } else if (typeof mediaObj === 'string') {
              try {
                const fetchedMedia = await req.payload.findByID({
                  collection: 'media',
                  id: mediaObj,
                });
                if (fetchedMedia) {
                  filename = fetchedMedia.filename || '';
                  mediaUrl = fetchedMedia.url || '';
                }
              } catch (e) {
                filename = mediaObj;
              }
            }

            // 1. Try local file paths first
            if (filename) {
              const pathsToTry = [
                path.resolve('public/media', filename),
                path.join(process.cwd(), 'public/media', filename),
                path.join(process.cwd(), 'public', filename),
              ];
              for (const filePath of pathsToTry) {
                if (fs.existsSync(filePath)) {
                  return fs.readFileSync(filePath);
                }
              }
            }

            // 2. Try fetching from URL or API media route (Vercel Blob Storage or Payload API)
            const targetUrls = [
              mediaUrl ? (mediaUrl.startsWith('http') ? mediaUrl : `${payloadUrl}${mediaUrl.startsWith('/') ? '' : '/'}${mediaUrl}`) : null,
              filename ? `${payloadUrl}/api/media/file/${filename}` : null,
            ].filter(Boolean) as string[];

            for (const url of targetUrls) {
              try {
                const res = await fetch(url);
                if (res.ok) {
                  const arrayBuffer = await res.arrayBuffer();
                  return Buffer.from(arrayBuffer);
                }
              } catch (e) {
                console.error('Failed to fetch media buffer from URL:', url, e);
              }
            }

            return null;
          };

          const targetBuffer = await getMediaBuffer(targetMediaField);
          const diBuffer = await getMediaBuffer(familyDiMediaField);

          if (!targetBuffer && !diBuffer) {
            return new Response(JSON.stringify({ error: 'No technical document or dismantle instruction found for this product.' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          let finalPdfBuffer: Uint8Array;

          const targetId = typeof targetMediaField === 'object' && targetMediaField ? targetMediaField.id : targetMediaField;
          const diId = typeof familyDiMediaField === 'object' && familyDiMediaField ? familyDiMediaField.id : familyDiMediaField;

          if (targetBuffer && diBuffer && String(targetId) !== String(diId)) {
            try {
              // Physically merge DI PDF pages into target document PDF using pdf-lib
              const mainPdf = await PDFDocument.load(targetBuffer);
              const diPdf = await PDFDocument.load(diBuffer);

              const copiedPages = await mainPdf.copyPages(diPdf, diPdf.getPageIndices());
              copiedPages.forEach((page) => mainPdf.addPage(page));

              finalPdfBuffer = await mainPdf.save();
            } catch (mergeErr) {
              console.error('Error merging PDF files:', mergeErr);
              finalPdfBuffer = targetBuffer;
            }
          } else if (targetBuffer) {
            finalPdfBuffer = targetBuffer;
          } else {
            // When no pre-uploaded static PDF document exists for this product,
            // redirect to the full dynamic technical document web page which renders all pages + dismantle instruction.
            const frontendUrl = process.env.PAYLOAD_PUBLIC_FRONTEND_URL 
              || process.env.NEXT_PUBLIC_FRONTEND_URL 
              || 'https://megaman-frontend.vercel.app';
            const pagePath = type === 'datasheet' 
              ? 'datasheet' 
              : (type === 'control-gear' ? 'control-gear' : (type === 'containing-product' ? 'containing-product' : 'eprel-light-source'));
            return Response.redirect(`${frontendUrl}/products/${id}/${pagePath}`, 302);
          }

          const { getTechnicalDocumentFilename } = await import('../utils/eprelXmlGenerator');
          const safeFilename = getTechnicalDocumentFilename(type, product);

          return new Response(new Uint8Array(finalPdfBuffer), {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${safeFilename}"`,
            },
          });
        } catch (err: any) {
          console.error('Error serving merged technical document:', err);
          return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
    {
      path: '/:id/eprel-xml',
      method: 'get',
      handler: async (req) => {
        try {
          if (!req.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const { id } = req.routeParams || {};
          const url = new URL(req.url || '', 'http://localhost');
          const regNumber = url.searchParams.get('regNumber') || '';
          const startDate = url.searchParams.get('startDate') || '2027-01-01+01:00';

          if (!id) {
            return new Response(JSON.stringify({ error: 'Product ID is required' }), { status: 400 });
          }

          // Fetch product with depth=2
          const product = await req.payload.findByID({
            collection: 'products',
            id: String(id),
            depth: 2,
          });

          if (!product) {
            return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
          }

          const { generateEprelXml } = await import('../utils/eprelXmlGenerator');
          const xmlContent = generateEprelXml({
            product,
            eprelRegistrationNumber: regNumber,
            onMarketStartDate: startDate,
          });

          const safeFilename = 'registration-data.xml';

          return new Response(xmlContent, {
            status: 200,
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Content-Disposition': `attachment; filename="${safeFilename}"`,
            },
          });
        } catch (err: any) {
          console.error('Error generating EPREL XML:', err);
          return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc }) => {
        // If specifications are already defined in the incoming data (i.e. manually pasted in UI),
        // do not overwrite them with MongoDB values unless the product name/SKU is changed.
        const nameChanged = originalDoc && data.name !== undefined && data.name !== originalDoc.name;
        if (data.specifications !== undefined && !nameChanged) {
          return data;
        }

        const modelNumber = data.name || originalDoc?.name;
        if (!modelNumber) {
          return data;
        }

        try {
          // Fetch specifications from general_data.luminaire
          const specs = await fetchSpecifications(modelNumber);

          if (specs) {
            // Update the incoming data with the fetched specifications
            data.specifications = specs;
            
            // Map power, colourTemperature, and colour if not explicitly set
            if (specs.on_mode_power_w && (data.power === undefined || data.power === null)) {
              data.power = String(specs.on_mode_power_w);
            }
            if (specs.cct_k && (data.colourTemperature === undefined || data.colourTemperature === null)) {
              data.colourTemperature = String(specs.cct_k);
            }
            if (specs.fitting_colour && (data.colour === undefined || data.colour === null)) {
              data.colour = String(specs.fitting_colour);
            }

            console.log(`Set specifications for product with model ${modelNumber}:`, specs);
          } else {
            console.warn(`No specifications found for model number: ${modelNumber}`);
          }
        } catch (error) {
          console.error(`Error in beforeChange hook for product:`, error);
        }

        return data;
      },
    ],
    afterDelete: [
      async ({ req, id }) => {
        // 1. Delete all SKUs referencing this product
        try {
          const deleteResult = await req.payload.delete({
            collection: 'skus',
            where: {
              product: {
                equals: id,
              },
            },
          });
          console.log(`Deleted all SKUs referencing product ID: ${id}`);
        } catch (error) {
          console.error(`Error deleting SKUs for product ${id}:`, error);
        }

        // 2. Remove product ID from any family relationship arrays
        try {
          const families = await req.payload.find({
            collection: 'families',
            where: {
              products: {
                equals: id,
              },
            },
          });

          for (const family of families.docs) {
            const updatedProducts = (family.products || [])
              .map((p: any) => (typeof p === 'object' && p !== null) ? p.id : p)
              .filter((pId: any) => pId !== id);

            await req.payload.update({
              collection: 'families',
              id: family.id,
              data: {
                products: updatedProducts,
              },
            });
            console.log(`Removed product ID ${id} from family: ${family.id}`);
          }
        } catch (error) {
          console.error(`Error removing product ID ${id} from family relationships:`, error);
        }
      },
    ],
    afterRead: [
      async ({ doc }) => {
        try {
          if (doc.families && typeof doc.families === 'object' && doc.families !== null) {
            const famDi = (doc.families as any).dismantleInstructionPdf;
            if (famDi) {
              if (!doc.techDocLightSource) {
                doc.techDocLightSource = famDi;
              }
            }
          }
        } catch (err) {
          // ignore error during hook execution
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Model Number',
    },
    {
      name: 'sites',
      type: 'select',
      hasMany: true,
      label: 'Display on Sites',
      required: true,
      defaultValue: ['international', 'hk'],
      options: [
        { label: 'International Website (megaman.cc)', value: 'international' },
        { label: 'Hong Kong Website (hk.megaman.cc)', value: 'hk' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Select which site(s) this product should be displayed on.',
      },
    },
    {
      name: 'quickDownloads',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/ProductQuickDownloads#ProductQuickDownloads',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },

    {
        name: 'families', // New field for product families
        type: 'relationship',
        relationTo: 'families',
        hasMany: false, // Typically one family per product, but adjust if needed
        required: false, // Optional, depending on your needs
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'datasheetPdf',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF Datasheet / Leaflet',
    },
    {
      name: 'photometryLdt',
      type: 'upload',
      relationTo: 'media',
      label: 'DIALux LDT Photometrics File',
    },
    {
      name: 'photometryIes',
      type: 'upload',
      relationTo: 'media',
      label: 'IES Photometrics File',
    },
    {
      name: 'lightSpectrumGraph',
      type: 'upload',
      relationTo: 'media',
      label: 'Light Spectrum Graph Image',
    },
    {
      name: 'lineDrawing',
      type: 'upload',
      relationTo: 'media',
      label: 'Line Drawing / Dimensional Drawing Image',
    },
    {
      name: 'photometricPolarDiagram',
      type: 'upload',
      relationTo: 'media',
      label: 'Photometric Polar Diagram Image',
    },
    {
      name: 'beamAngleDiagram',
      type: 'upload',
      relationTo: 'media',
      label: 'Beam Angle Diagram Image',
    },
    {
      name: 'techDocControlGear',
      type: 'upload',
      relationTo: 'media',
      label: 'Technical Document - Control Gear',
    },
    {
      name: 'techDocContainingProduct',
      type: 'upload',
      relationTo: 'media',
      label: 'Technical Document - Containing Product',
    },
    {
      name: 'techDocLightSource',
      type: 'upload',
      relationTo: 'media',
      label: 'Technical Document - Light Source',
    },
    {
      name: 'colour',
      type: 'text',
    },
    {
      name: 'power',
      type: 'text',
    },
    {
      name: 'colourTemperature',
      type: 'text',
      label: 'Colour Temperature',
    },
    {
      name: 'specifications',
      type: 'json',
      label: 'Specifications',
      admin: {
        description: 'Specifications will be fetched from the general_data.luminaire collection.',
      },
    },
  ],
};

