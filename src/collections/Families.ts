import { CollectionConfig } from 'payload'
import { EditorialBlock, HighlightProductsBlock, InspirationBlock } from '../blocks/layoutBlocks'

export const Families: CollectionConfig = {
  slug: 'families',
  admin: {
    useAsTitle: 'name', // Displays family name in admin UI
  },
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
      name: 'layout',
      type: 'blocks',
      label: 'Page Layout Sections (Rendered above Technical Configurations)',
      blocks: [
        EditorialBlock,
        HighlightProductsBlock,
        InspirationBlock,
      ],
    },
  ],
}
