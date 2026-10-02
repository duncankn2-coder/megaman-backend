import { CollectionConfig } from 'payload'
import { EditorialBlock, HighlightProductsBlock, InspirationBlock, ScrollVideoBlock } from '../blocks/layoutBlocks'
import {
  DatasheetCustomContentBlock,
  DatasheetTextBlock,
  DatasheetDrawingBlock,
  DatasheetPhotometryBlock,
  DatasheetFeaturesBlock,
  DatasheetSymbolsBlock,
} from '../blocks/datasheetBlocks'

export const DATASHEET_PARAMETER_OPTIONS = [
  { label: 'MM Code', value: 'mmCode' },
  { label: 'Model No.', value: 'modelNo' },
  { label: 'Product Code / Option Code', value: 'optionCode' },
  { label: 'Luminaire Finish / Colour', value: 'colour' },
  { label: 'Power (W)', value: 'wattage' },
  { label: 'Luminous Flux (lm)', value: 'luminousFlux' },
  { label: 'CCT (K)', value: 'colourTemperature' },
  { label: 'CRI (Ra)', value: 'cri' },
  { label: 'Efficacy (lm/W)', value: 'efficacy' },
  { label: 'Beam Angle (°)', value: 'beamAngle' },
  { label: 'IP Rating', value: 'ip' },
  { label: 'IK Rating', value: 'ik' },
  { label: 'Control Gear / Driver', value: 'controlGear' },
  { label: 'Connector / Terminal Block', value: 'connector' },
  { label: 'Dimming Type', value: 'dimmingType' },
  { label: 'Dimming Range', value: 'dimmingRange' },
  { label: 'Rated Voltage (V)', value: 'voltage' },
  { label: 'Frequency (Hz)', value: 'frequency' },
  { label: 'Input Current (mA)', value: 'inputCurrent' },
  { label: 'Power Factor', value: 'powerFactor' },
  { label: 'Cap / Base', value: 'lampBase' },
  { label: 'Dimensions (mm)', value: 'dimensions' },
  { label: 'Recessed Cut-out (mm)', value: 'recessedCutOut' },
  { label: 'Weight (g)', value: 'weight' },
  { label: 'Lifetime (h)', value: 'lifetime' },
  { label: 'Switching Cycles', value: 'switchingCycles' },
  { label: 'Energy Class', value: 'energyClass' },
  { label: 'Protection Class', value: 'protectionClass' },
  { label: 'Glow Wire (°C)', value: 'glowWire' },
  { label: 'Housing Material', value: 'housingMaterial' },
  { label: 'Optics / Diffuser Material', value: 'diffuserMaterial' },
  { label: 'Operating Temperature (°C)', value: 'operatingTemperature' },
  { label: 'Symbols / Certifications', value: 'symbols' },
];

export const Families: CollectionConfig = {
  slug: 'families',
  admin: {
    useAsTitle: 'name', // Displays family name in admin UI
    defaultColumns: ['name', 'priority', 'categories', 'updatedAt'],
  },
  defaultSort: '-priority',
  access: {
    read: () => true, // Allow anyone to read products
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'priority',
      type: 'number',
      label: 'Priority',
      defaultValue: 0,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Display priority on the catalog page. Higher numbers appear first (e.g. 100 before 10). Default is 0.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
    },
    {
      name: 'media',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      required: true,
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'features',
      type: 'array',
      label: 'Key Features',
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
          label: 'Feature Description',
        }
      ]
    },
    {
      name: 'applications',
      type: 'array',
      label: 'Applications',
      fields: [
        {
          name: 'application',
          type: 'text',
          required: true,
          label: 'Application Item',
        }
      ]
    },
    {
      name: 'symbols',
      type: 'relationship',
      relationTo: 'symbols',
      hasMany: true,
      label: 'Symbols / Certifications',
    },
    {
      name: 'dismantleInstructionPdf',
      type: 'upload',
      relationTo: 'media',
      label: 'Dismantle Instruction PDF ([family_name]_di.pdf)',
      admin: {
        description: 'Uploaded PDF for Market Surveillance Dismantle Instruction. Automatically merged into Technical Document - Light Source and Technical Document - Control Gear for all products in this family.',
      },
    },
    {
      name: 'selectedParameters',
      type: 'select',
      label: 'Visible Parameters (Filters & Columns)',
      hasMany: true,
      admin: {
        description: 'Select which parameters/specifications are active for this family. This controls both the visible dropdown filters and the Technical Configuration spreadsheet columns.',
      },
      options: [
        { label: 'MM Code', value: 'mmCode' },
        { label: 'Model No.', value: 'modelNo' },
        { label: 'Luminaire Finish / Colour', value: 'colour' },
        { label: 'Power (Wattage)', value: 'wattage' },
        { label: 'Luminous Flux', value: 'luminousFlux' },
        { label: 'CCT (Color Temperature)', value: 'colourTemperature' },
        { label: 'CRI', value: 'cri' },
        { label: 'Efficacy (lm/W)', value: 'efficacy' },
        { label: 'IP Rating', value: 'ip' },
        { label: 'Control Gear / Connector', value: 'connector' },
        { label: 'Cap / Base', value: 'lampBase' },
        { label: 'Voltage', value: 'voltage' },
        { label: 'Symbols / Certifications', value: 'symbols' },
      ],
      defaultValue: ['mmCode', 'modelNo', 'colour', 'wattage', 'luminousFlux', 'colourTemperature', 'cri', 'efficacy', 'ip', 'connector', 'symbols'],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Page Layout Sections (Rendered above Technical Configurations)',
      blocks: [
        EditorialBlock,
        HighlightProductsBlock,
        InspirationBlock,
        ScrollVideoBlock,
      ],
    },
    {
      name: 'datasheet',
      type: 'group',
      label: 'Family Datasheet Layout & Contents',
      admin: {
        description: 'Configure multi-page family datasheet layouts, tables, parameters, and content for this family.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Family Datasheet',
          defaultValue: false,
          admin: {
            description: 'Enable or disable custom multi-page datasheet configuration for this family. Defaults to disabled.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Datasheet Title Override',
              admin: {
                width: '50%',
                description: 'Leave blank to use Family Name by default.',
              },
            },
            {
              name: 'subtitle',
              type: 'text',
              label: 'Datasheet Subtitle / Tagline',
              admin: {
                width: '50%',
                description: 'Optional series tagline (e.g. "Compact Integrated LED Downlights with High IP Protection")',
              },
            },
          ],
        },
        {
          name: 'headerImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Datasheet Hero / Header Image (Optional)',
          admin: {
            description: 'Main product / application image displayed on the cover or header of the datasheet.',
          },
        },
        {
          name: 'pages',
          type: 'array',
          label: 'Datasheet Pages',
          labels: {
            singular: 'Page',
            plural: 'Pages',
          },
          admin: {
            description: 'Create and organize pages of the family datasheet.',
            initCollapsed: false,
          },
          fields: [
            {
              name: 'pageNumber',
              type: 'number',
              label: 'Page Number',
            },
            {
              name: 'tables',
              type: 'array',
              label: 'Specification Tables',
              labels: {
                singular: 'Table',
                plural: 'Tables',
              },
              admin: {
                description: 'Add technical tables to this page, set their names, and select which parameters are displayed.',
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'tableType',
                  type: 'select',
                  label: 'Table Type',
                  defaultValue: 'horizontal',
                  required: true,
                  options: [
                    {
                      label: 'Horizontal Table (Parameter headers in 1st row, multiple models)',
                      value: 'horizontal',
                    },
                    {
                      label: 'Vertical Table (Parameter headers in 1st column, single value column)',
                      value: 'vertical',
                    },
                  ],
                  admin: {
                    description: 'Choose whether parameter headers appear across the top row (horizontal matrix) or down the first column with a single value column next to it.',
                  },
                },
                {
                  name: 'tableName',
                  type: 'text',
                  required: true,
                  label: 'Table Name / Title',
                  admin: {
                    description: 'e.g. "Standard Luminaires", "Technical & Electrical Specifications", "General Characteristics"',
                  },
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
                    description: 'Select parameters to display. For horizontal tables, these are the column headers. For vertical tables, these are the row headers in the first column.',
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
                {
                  name: 'tableFootnote',
                  type: 'text',
                  label: 'Table Footnote / Legend',
                  admin: {
                    description: 'Optional footnote at the bottom of the table (e.g. "*Tolerance +/- 10% on luminous flux")',
                  },
                },
              ],
            },
            {
              name: 'pageContents',
              type: 'blocks',
              label: 'Additional Page Content Sections (Optional)',
              admin: {
                description: 'Add optional diagrams, drawings, feature highlights, or notes to this datasheet page.',
              },
              blocks: [
                DatasheetCustomContentBlock,
                DatasheetTextBlock,
                DatasheetDrawingBlock,
                DatasheetPhotometryBlock,
                DatasheetFeaturesBlock,
                DatasheetSymbolsBlock,
              ],
            },
          ],
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'General Datasheet Footnote / Disclaimer',
          admin: {
            description: 'General footer note or disclaimer displayed at the end of the datasheet document.',
          },
        },
      ],
    },
  ],
}

