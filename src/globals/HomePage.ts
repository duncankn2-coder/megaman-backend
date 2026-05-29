import { GlobalConfig } from 'payload';

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Home Page Configuration',
  access: {
    read: () => true, // Anyone can read
    update: ({ req }) => !!req.user, // Only authenticated users can edit
  },
  fields: [
    {
      name: 'heroSlides',
      type: 'array',
      label: 'Hero Carousel Slides',
      labels: {
        singular: 'Hero Slide',
        plural: 'Hero Slides',
      },
      minRows: 1,
      maxRows: 5,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Slide Title / Heading',
          required: true,
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Slide Subtitle / Category Label',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Slide Short Description',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Slide Background Image',
          required: true,
        },
        {
          name: 'ctaText',
          type: 'text',
          label: 'Button text (CTA)',
          defaultValue: 'EXPLORE RANGE',
        },
        {
          name: 'ctaLink',
          type: 'text',
          label: 'Button link URL',
          defaultValue: '#categories-section',
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Dynamic Editorial Sections',
      labels: {
        singular: 'Dynamic Section',
        plural: 'Dynamic Sections',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Section Title',
          required: true,
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Section Category Subtitle',
        },
        {
          name: 'content',
          type: 'textarea',
          label: 'Section Narrative Content',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Section Image',
        },
        {
          name: 'linkText',
          type: 'text',
          label: 'Action Link Text',
        },
        {
          name: 'linkUrl',
          type: 'text',
          label: 'Action Link URL',
        },
        {
          name: 'layout',
          type: 'select',
          label: 'Editorial Layout Alignment',
          defaultValue: 'grid',
          options: [
            { label: 'Standard Editorial Block', value: 'grid' },
            { label: 'Split Screen (Left Image / Right Text)', value: 'split-left' },
            { label: 'Split Screen (Right Image / Left Text)', value: 'split-right' },
          ],
        },
      ],
    },
  ],
};
