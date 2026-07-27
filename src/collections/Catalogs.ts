import { CollectionConfig } from 'payload'

export const Catalogs: CollectionConfig = {
  slug: 'catalogs',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true, // Allow anyone to read catalogs
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'general',
      options: [
        { label: 'General / Corporate', value: 'general' },
        { label: 'Lamps Catalog', value: 'lamps' },
        { label: 'Indoor Lighting Catalog', value: 'indoor' },
        { label: 'Outdoor Lighting Catalog', value: 'outdoor' },
        { label: 'Technical Guide', value: 'technical' },
      ],
    },
    {
      name: 'catalogFile',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Catalog PDF File',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover Image (Optional)',
    },
  ],
}
