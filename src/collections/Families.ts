import { CollectionConfig } from 'payload'
import { EditorialBlock, HighlightProductsBlock, InspirationBlock, ScrollVideoBlock } from '../blocks/layoutBlocks'

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
      ],
      defaultValue: ['mmCode', 'modelNo', 'colour', 'wattage', 'luminousFlux', 'colourTemperature', 'cri', 'efficacy', 'ip', 'connector'],
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
  ],
}
