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
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Model Number',
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
      name: 'bimRevit',
      type: 'upload',
      relationTo: 'media',
      label: 'BIM Revit Object File',
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

