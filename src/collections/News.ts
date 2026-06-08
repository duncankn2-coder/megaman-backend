import { CollectionConfig } from 'payload';

export const News: CollectionConfig = {
  slug: 'news',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishDate'],
  },
  access: {
    read: () => true, // Allow anyone to read news posts
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
      name: 'category',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. MATTER SMART HOME, ECO SYSTEM, NEW ARRIVALS',
      },
    },
    {
      name: 'publishDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Main Content / Press Release Body',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'linkText',
      type: 'text',
      defaultValue: 'Read Press Release',
      label: 'CTA Link Text',
    },
    {
      name: 'linkUrl',
      type: 'text',
      defaultValue: '#',
      label: 'CTA Link URL (use absolute paths or external links)',
    },
  ],
};
