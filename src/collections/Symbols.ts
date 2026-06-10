import { CollectionConfig } from 'payload'

export const Symbols: CollectionConfig = {
  slug: 'symbols',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true, // Allow anyone to read symbols
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Symbol Name (e.g. CE, IP54)',
    },
    {
      name: 'icon',
      type: 'relationship',
      relationTo: 'media',
      label: 'Icon / Image (Optional)',
      required: false,
    },
    {
      name: 'isHighlighted',
      type: 'checkbox',
      label: 'Highlight Badge (blue styling)',
      defaultValue: false,
    },
  ],
}
