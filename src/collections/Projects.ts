import { CollectionConfig } from 'payload';

// Projects Collection
export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true, // Allow anyone to read projects
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.title) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from title if left blank)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'applicationType',
      type: 'select',
      required: true,
      options: [
        { label: 'Hospitality', value: 'hospitality' },
        { label: 'Retail', value: 'retail' },
        { label: 'Residential', value: 'residential' },
        { label: 'Commercial', value: 'commercial' },
      ],
    },
    {
      name: 'listImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'List View Image (Square)',
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Detail Banner Image',
    },
    {
      name: 'contentRows',
      type: 'array',
      label: 'Detail Content Rows',
      fields: [
        {
          name: 'layoutType',
          type: 'select',
          required: true,
          defaultValue: 'full',
          options: [
            { label: 'Full Width', value: 'full' },
            { label: '1/3 Left, 2/3 Right', value: 'one-third-two-thirds' },
            { label: '2/3 Left, 1/3 Right', value: 'two-thirds-one-third' },
            { label: '1/2 Left, 1/2 Right', value: 'half-half' },
          ],
        },
        {
          name: 'leftImage',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Left Image (or Full Width Image)',
        },
        {
          name: 'rightImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Right Image (conditionally visible)',
          admin: {
            condition: (data, siblingData) => siblingData?.layoutType !== 'full',
          },
        },
      ],
    },
  ],
};

