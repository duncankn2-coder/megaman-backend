import { CollectionConfig } from 'payload';

export const Skus: CollectionConfig = {
  slug: 'skus',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true, // Allow anyone to read SKUs
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'MM Code (SKU)', // e.g. MM12717
      unique: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      label: 'Base Product',
    },
    {
      name: 'modelNumber',
      type: 'text',
      label: 'Model No (e.g. FPL71900v1-ex/ta+LD247038-C0900)',
    },
    {
      name: 'colour',
      type: 'text',
      label: 'Luminaire Colour',
    },
    {
      name: 'specialFeatures',
      type: 'text',
      label: 'Special Features',
    },
    {
      name: 'wattage',
      type: 'text',
      label: 'Wattage',
    },
    {
      name: 'lampBase',
      type: 'text',
      label: 'Lamp Base',
    },
    {
      name: 'colourTemperature',
      type: 'text',
      label: 'Colour Temp',
    },
    {
      name: 'voltage',
      type: 'text',
    },
    {
      name: 'connector',
      type: 'text',
      label: 'Connector / Terminal Block',
    },
    {
      name: 'ip',
      type: 'text',
      label: 'IP Rating',
    },
    {
      name: 'eanBarcode',
      type: 'text',
      label: 'EAN13 Barcode',
    },
    {
      name: 'innerBoxItf',
      type: 'text',
      label: 'Inner Box ITF14',
    },
    {
      name: 'outerBoxItf',
      type: 'text',
      label: 'Outer Box ITF14',
    },
    {
      name: 'packingMethod',
      type: 'text',
      label: 'Packing Method',
    },
    {
      name: 'remark',
      type: 'textarea',
    },
    {
      name: 'photometryLdt',
      type: 'upload',
      relationTo: 'media',
      label: 'LDT Photometrics File',
    },
    {
      name: 'photometryIes',
      type: 'upload',
      relationTo: 'media',
      label: 'IES Photometrics File',
    },
    {
      name: 'specifications',
      type: 'json',
      label: 'SKU Specifications',
    },
  ],
};
