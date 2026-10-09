import { Block, Field } from 'payload';
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

export const DATASHEET_PARAMETER_OPTIONS = [
  // Identification
  { label: 'MM Code', value: 'mmCode' },
  { label: 'Model No.', value: 'modelNo' },
  { label: 'Product Code / Option Code', value: 'optionCode' },
  { label: 'Luminaire Finish / Colour', value: 'colour' },

  // Electrical & Performance
  { label: 'Power (W)', value: 'wattage' },
  { label: 'Luminous Flux (lm)', value: 'luminousFlux' },
  { label: 'CCT (K)', value: 'colourTemperature' },
  { label: 'CRI (Ra)', value: 'cri' },
  { label: 'Efficacy (lm/W)', value: 'efficacy' },
  { label: 'Beam Angle (°)', value: 'beamAngle' },
  { label: 'Rated Voltage (V)', value: 'voltage' },
  { label: 'Frequency (Hz)', value: 'frequency' },
  { label: 'Input Current (mA)', value: 'inputCurrent' },
  { label: 'Power Factor', value: 'powerFactor' },
  { label: 'Displacement Factor', value: 'displacementFactor' },
  { label: 'THD (%)', value: 'thd' },

  // General Data: Inrush & MCB
  { label: 'Inrush Current (A)', value: 'inrushCurrent' },
  { label: 'Inrush Duration (µs)', value: 'inrushDuration' },
  { label: 'Max. No. of Luminaire connection on MCB', value: 'maxNoOfLuminaire' },
  { label: 'Max. Luminaires on MCB Type B10', value: 'mcbB10' },
  { label: 'Max. Luminaires on MCB Type B16', value: 'mcbB16' },
  { label: 'Max. Luminaires on MCB Type C10', value: 'mcbC10' },
  { label: 'Max. Luminaires on MCB Type C16', value: 'mcbC16' },

  // General Data: Surge & Driver Output
  { label: 'Surge Protection (V)', value: 'surgeProtection' },
  { label: 'Output Voltage (V)', value: 'outputVoltage' },
  { label: 'Output Current (mA)', value: 'outputCurrent' },

  // General Data: Photometrics & Optical Quality
  { label: 'Colour Consistency (SDCM)', value: 'colourConsistency' },
  { label: 'Unified Glare Rating (UGR)', value: 'ugr' },
  { label: 'Max. Luminous Intensity (cd)', value: 'maxIntensity' },
  { label: 'Cut-off Angle (°)', value: 'cutoffAngle' },
  { label: 'Flicker Metric (Pst LM)', value: 'flickerMetric' },
  { label: 'Stroboscopic Effect (SVM)', value: 'svm' },
  { label: 'Photobiological Safety', value: 'photobiologicalRisk' },

  // Control & Connection
  { label: 'Control Gear / Driver', value: 'controlGear' },
  { label: 'Connector / Terminal Block', value: 'connector' },
  { label: 'Dimming Type', value: 'dimmingType' },
  { label: 'Dimming Range', value: 'dimmingRange' },
  { label: 'Cap / Base', value: 'lampBase' },

  // Physical & Mechanical
  { label: 'Length (mm)', value: 'length' },
  { label: 'Width (mm)', value: 'width' },
  { label: 'Height (mm)', value: 'height' },
  { label: 'Diameter (mm)', value: 'diameter' },
  { label: 'Dimensions (mm)', value: 'dimensions' },
  { label: 'Recessed Cut-out (mm)', value: 'recessedCutOut' },
  { label: 'Weight (g)', value: 'weight' },
  { label: 'Shape', value: 'shape' },
  { label: 'Housing Material', value: 'housingMaterial' },
  { label: 'Optics / Diffuser Material', value: 'diffuserMaterial' },
  { label: 'Mounting / Installation', value: 'mounting' },

  // Reliability & Protection
  { label: 'IP Rating', value: 'ip' },
  { label: 'IK Rating', value: 'ik' },
  { label: 'Protection Class', value: 'protectionClass' },
  { label: 'Glow Wire (°C)', value: 'glowWire' },
  { label: 'Operating Temperature (°C)', value: 'operatingTemperature' },
  { label: 'Lifetime (h)', value: 'lifetime' },
  { label: 'Switching Cycles', value: 'switchingCycles' },
  { label: 'Energy Class', value: 'energyClass' },
  { label: 'Standards Compliance', value: 'standards' },
  { label: 'Features', value: 'symbols' },

  // Emergency Specifications
  { label: 'Emergency Power (W)', value: 'emergencyPower' },
  { label: 'Emergency Duration (h)', value: 'emergencyDuration' },
  { label: 'Emergency Battery Type', value: 'emergencyBattery' },
  { label: 'Emergency Luminous Flux (lm)', value: 'emergencyLumen' },
];

export const DatasheetTableBlock: Block = {
  slug: 'datasheetTable',
  labels: {
    singular: 'Specification Table',
    plural: 'Specification Tables',
  },
  fields: [
    {
      name: 'tableName',
      type: 'text',
      required: true,
      label: 'Table Name / Title',
      defaultValue: 'Technical Specifications',
      admin: {
        description: 'e.g. "Standard Luminaires", "Technical & Electrical Specifications", "General Characteristics"',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'tableType',
          type: 'select',
          label: 'Table Type',
          defaultValue: 'horizontal',
          required: true,
          admin: {
            width: '50%',
            description: 'Horizontal (columns) or Vertical (rows).',
          },
          options: [
            {
              label: 'Horizontal Table (Parameter headers in top row, multiple models)',
              value: 'horizontal',
            },
            {
              label: 'Vertical Table (Parameter headers in 1st column, single value column)',
              value: 'vertical',
            },
          ],
        },
        {
          name: 'tableFootnote',
          type: 'text',
          label: 'Table Footnote / Legend',
          admin: {
            width: '50%',
            description: 'Optional footnote at the bottom of the table (e.g. "*Tolerance +/- 10% on luminous flux")',
          },
        },
      ],
    },
    {
      name: 'tableDescription',
      type: 'textarea',
      label: 'Table Subtitle / Note',
      admin: {
        description: 'Optional note displayed below the table title (e.g. "Operating at 220-240V, 50/60Hz, Ra80")',
      },
    },
    {
      name: 'selectedParameters',
      type: 'select',
      hasMany: true,
      label: 'Selected Parameters',
      admin: {
        description: 'Select parameters to display. For horizontal tables, these are the column headers. For vertical tables, these are the row headers.',
      },
      defaultValue: [
        'mmCode',
        'modelNo',
        'colour',
        'wattage',
        'luminousFlux',
        'colourTemperature',
        'cri',
        'efficacy',
        'ip',
        'controlGear',
        'symbols',
      ],
      options: DATASHEET_PARAMETER_OPTIONS,
    },
    {
      name: 'customRows',
      type: 'array',
      label: 'Custom Parameter Rows',
      labels: {
        singular: 'Custom Row',
        plural: 'Custom Rows',
      },
      admin: {
        condition: (data, siblingData) => siblingData?.tableType === 'vertical',
        description: 'Optional custom parameter-value rows for vertical tables (Parameter header in 1st column, Value in 2nd column).',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'parameter',
              type: 'text',
              required: true,
              label: 'Parameter Header (1st Column)',
              admin: { width: '50%' },
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              label: 'Value (2nd Column)',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
};

export const DatasheetPageBreakBlock: Block = {
  slug: 'datasheetPageBreak',
  labels: {
    singular: 'Page Break (Start New Page)',
    plural: 'Page Breaks',
  },
  fields: [
    {
      name: 'note',
      type: 'text',
      label: 'Page Break Note / Label (Optional)',
      admin: {
        placeholder: 'e.g. New Page - Photometrics & Drawing',
        description: 'Inserts an explicit A4 page break here. Content added below this section will start on the next page.',
      },
    },
  ],
};

const sectionOrderingFields: Field[] = [
  {
    name: 'placement',
    type: 'select',
    label: 'Placement on Page (Legacy)',
    defaultValue: 'auto',
    admin: {
      width: '50%',
      description: 'Position relative to specification tables',
    },
    options: [
      { label: 'Auto (Follows Page Section Order)', value: 'auto' },
      { label: 'Top (Before Specification Tables)', value: 'top' },
      { label: 'Bottom (After Specification Tables)', value: 'bottom' },
    ],
  },
  {
    name: 'displayPriority',
    type: 'number',
    label: 'Display Priority / Order (Legacy)',
    admin: {
      width: '50%',
      placeholder: 'e.g. 5, 15, 25...',
      description: 'Lower number appears first on the page.',
    },
  },
];

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
      type: 'row',
      fields: sectionOrderingFields,
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
      type: 'row',
      fields: sectionOrderingFields,
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
      type: 'row',
      fields: sectionOrderingFields,
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
      type: 'row',
      fields: sectionOrderingFields,
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
      type: 'row',
      fields: sectionOrderingFields,
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
      type: 'row',
      fields: sectionOrderingFields,
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
