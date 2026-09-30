import { Block } from 'payload';

export const DatasheetTextBlock: Block = {
  slug: 'datasheetText',
  labels: {
    singular: 'Text & Notes Section',
    plural: 'Text & Notes Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Heading',
      required: false,
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Narrative / Technical Notes',
      required: true,
    },
  ],
};

export const DatasheetDrawingBlock: Block = {
  slug: 'datasheetDrawing',
  labels: {
    singular: 'Dimensional Drawing Section',
    plural: 'Dimensional Drawing Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Drawing Title',
      defaultValue: 'DIMENSIONS & MOUNTING',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Line Drawing / Dimensional Diagram Image',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption / Dimensions Summary',
    },
  ],
};

export const DatasheetPhotometryBlock: Block = {
  slug: 'datasheetPhotometry',
  labels: {
    singular: 'Photometrics Diagram Section',
    plural: 'Photometrics Diagram Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Diagram Title',
      defaultValue: 'PHOTOMETRIC DATA',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Polar Curve / Cone Diagram Image',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption / Beam Angle Description',
    },
  ],
};

export const DatasheetFeaturesBlock: Block = {
  slug: 'datasheetFeatures',
  labels: {
    singular: 'Key Features List',
    plural: 'Key Features Lists',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Features Heading',
      defaultValue: 'KEY FEATURES & BENEFITS',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Feature Items',
      labels: {
        singular: 'Feature',
        plural: 'Features',
      },
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
          label: 'Feature Bullet Point',
        },
      ],
    },
  ],
};

export const DatasheetSymbolsBlock: Block = {
  slug: 'datasheetSymbols',
  labels: {
    singular: 'Certifications & Symbols Section',
    plural: 'Certifications & Symbols Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Heading',
      defaultValue: 'STANDARDS & CERTIFICATIONS',
    },
    {
      name: 'symbols',
      type: 'relationship',
      relationTo: 'symbols',
      hasMany: true,
      label: 'Select Symbols / Icons',
    },
  ],
};
