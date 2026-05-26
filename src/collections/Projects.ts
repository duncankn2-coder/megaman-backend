import { CollectionConfig } from 'payload';

// Projects Collection
export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true, // Allow anyone to read products
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
      name: 'location',
      type: 'text',
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
};

