import { Block } from 'payload';

export const HeroBlock: Block = {
  slug: 'hero',
  labels: {
    singular: 'Hero Carousel',
    plural: 'Hero Carousels',
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Hero Slides',
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
  ],
};

export const CategoriesGridBlock: Block = {
  slug: 'categoriesGrid',
  labels: {
    singular: 'Product Categories Grid',
    plural: 'Product Categories Grids',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      defaultValue: 'PRODUCT CATEGORIES',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      defaultValue: 'PORTFOLIO OVERVIEW',
    },
    {
      name: 'categories',
      type: 'array',
      label: 'Category Items',
      minRows: 1,
      maxRows: 8,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Category Name',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Category Image',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Category Description',
        },
        {
          name: 'linkUrl',
          type: 'text',
          label: 'Explore Link URL',
          required: true,
        },
        {
          name: 'linkText',
          type: 'text',
          label: 'Explore Link Text',
          defaultValue: 'Explore Range',
        },
      ],
    },
  ],
};

export const EditorialBlock: Block = {
  slug: 'editorial',
  labels: {
    singular: 'Editorial Section',
    plural: 'Editorial Sections',
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
};

export const HighlightProductsBlock: Block = {
  slug: 'highlightProducts',
  labels: {
    singular: 'Highlight Products Section',
    plural: 'Highlight Products Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      defaultValue: 'HIGHLIGHTED PRODUCTS',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      defaultValue: 'PREMIUM SELECTIONS',
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      required: true,
      label: 'Select Products to Highlight',
    },
  ],
};

export const InspirationBlock: Block = {
  slug: 'inspiration',
  labels: {
    singular: 'Creative Inspiration Section',
    plural: 'Creative Inspiration Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      defaultValue: 'CREATIVE INSPIRATION',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      defaultValue: 'PROJECTS & REFERENCES',
    },
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      required: true,
      label: 'Select Projects to Display',
    },
  ],
};

export const NewsBlock: Block = {
  slug: 'news',
  labels: {
    singular: 'Latest News Section',
    plural: 'Latest News Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      defaultValue: 'LATEST NEWS',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      defaultValue: 'PRESS & MEDIA',
    },
    {
      name: 'source',
      type: 'select',
      label: 'News Source Feed',
      defaultValue: 'latest',
      options: [
        { label: 'Display Latest News (Auto)', value: 'latest' },
        { label: 'Manually Featured News', value: 'custom' },
      ],
    },
    {
      name: 'featuredNews',
      type: 'relationship',
      relationTo: 'news',
      hasMany: true,
      label: 'Featured News Articles',
      admin: {
        condition: (data, siblingData) => siblingData?.source === 'custom',
      },
    },
  ],
};
