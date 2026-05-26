import { CollectionConfig } from 'payload';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name', // Displays category name in admin UI
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories', // Self-referencing relationship
      hasMany: false, // Each category has one parent (optional)
      filterOptions: ({ id }) => ({
        id: { not_equals: id }, // Prevents a category from being its own parent
      }),
    },
  ],
};