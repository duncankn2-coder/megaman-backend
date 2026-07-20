import { CollectionConfig } from 'payload';

export const Awards: CollectionConfig = {
  slug: 'awards',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'year', 'institution'],
  },
  access: {
    read: () => true, // Allow anyone to read awards
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
      name: 'year',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. 2025, 2013-17',
      },
    },
    {
      name: 'institution',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. Hong Kong Commercial Daily, BATIBOUW, Belgium',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Environmental', value: 'environmental' },
        { label: 'Quality Recognition', value: 'quality' },
        { label: 'Technology', value: 'technological' },
        { label: 'Other Endorsements', value: 'other' },
      ],
      admin: {
        description: 'Awards category to filter by on the website',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Image file for the award brand logo',
      },
    },
  ],
};
