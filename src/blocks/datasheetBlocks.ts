import { Block } from 'payload';
import {
  lexicalEditor,
  lexicalHTML,
  FixedToolbarFeature,
  EXPERIMENTAL_TableFeature,
  UploadFeature,
  HeadingFeature,
  AlignFeature,
  HTMLConverterFeature,
} from '@payloadcms/richtext-lexical';

export const DatasheetCustomContentBlock: Block = {
  slug: 'datasheetCustomContent',
  labels: {
    singular: 'Custom Word Editor Content',
    plural: 'Custom Word Editor Contents',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Heading (Optional)',
      admin: {
        description: 'Optional heading displayed above your custom Word-style content.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Custom Content (Word Editor)',
      required: true,
      admin: {
        description: 'Word-style rich text editor. Create custom tables, format text, and paste/insert images.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          EXPERIMENTAL_TableFeature(),
          UploadFeature({
            collections: {
              media: {
                fields: [
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'width',
                        type: 'select',
                        label: 'Image Width / Row Layout',
                        defaultValue: '50%',
                        admin: {
                          width: '50%',
                          description: '50% fits 2 in a row, 33% fits 3, 25% fits 4',
                        },
                        options: [
                          { label: '50% (Fits 2 in a row)', value: '50%' },
                          { label: '33.3% (Fits 3 in a row)', value: '33%' },
                          { label: '25% (Fits 4 in a row)', value: '25%' },
                          { label: '100% (Full Width - 1 per row)', value: '100%' },
                          { label: 'Badge / Icon (100px)', value: '100px' },
                          { label: 'Small (150px)', value: '150px' },
                          { label: 'Medium (220px)', value: '220px' },
                          { label: 'Large (300px)', value: '300px' },
                          { label: 'Auto (Natural Size)', value: 'auto' },
                          { label: 'Custom Width', value: 'custom' },
                        ],
                      },
                      {
                        name: 'maxHeight',
                        type: 'select',
                        label: 'Max Height',
                        defaultValue: '160px',
                        admin: {
                          width: '50%',
                          description: 'Constrain max height to prevent overflowing',
                        },
                        options: [
                          { label: 'Compact (90px)', value: '90px' },
                          { label: 'Medium (140px)', value: '140px' },
                          { label: 'Standard (180px)', value: '180px' },
                          { label: 'Large (240px)', value: '240px' },
                          { label: 'No Limit / Auto', value: 'none' },
                          { label: 'Custom Height', value: 'custom' },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'customWidth',
                        type: 'text',
                        label: 'Custom Width (e.g. 180px, 45%)',
                        admin: {
                          width: '50%',
                          placeholder: 'e.g. 180px or 45%',
                        },
                      },
                      {
                        name: 'customHeight',
                        type: 'text',
                        label: 'Custom Max Height (e.g. 120px, 35mm)',
                        admin: {
                          width: '50%',
                          placeholder: 'e.g. 120px or 35mm',
                        },
                      },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'alignment',
                        type: 'select',
                        label: 'Alignment',
                        defaultValue: 'center',
                        admin: {
                          width: '50%',
                        },
                        options: [
                          { label: 'Center', value: 'center' },
                          { label: 'Left', value: 'left' },
                          { label: 'Right', value: 'right' },
                        ],
                      },
                      {
                        name: 'caption',
                        type: 'text',
                        label: 'Caption / Dimension Note',
                        admin: {
                          width: '50%',
                          placeholder: 'Optional caption below image',
                        },
                      },
                    ],
                  },
                ],
              },
            },
          }),
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
          AlignFeature(),
          HTMLConverterFeature(),
        ],
      }),
    },
    lexicalHTML('content', { name: 'content_html' }),
  ],
};

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
