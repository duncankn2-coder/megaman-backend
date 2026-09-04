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
      maxRows: 16,
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

export const ScrollVideoBlock: Block = {
  slug: 'scrollVideo',
  labels: {
    singular: 'Scroll-Driven Video Showcase',
    plural: 'Scroll-Driven Video Showcases',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Main Heading',
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Category Subtitle',
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      label: 'Scroll Video (Desktop MP4)',
    },
    {
      name: 'mobileVideo',
      type: 'upload',
      relationTo: 'media',
      label: 'Scroll Video (Mobile MP4, Optional)',
    },
    {
      name: 'captions',
      type: 'array',
      label: 'Scroll Storytelling Captions & CTAs',
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Caption Title / Heading',
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
          label: 'Caption Narrative Text',
        },
        {
          name: 'align',
          type: 'select',
          label: 'Caption Screen Alignment',
          defaultValue: 'left',
          options: [
            { label: 'Left Aligned', value: 'left' },
            { label: 'Center Aligned', value: 'center' },
            { label: 'Right Aligned', value: 'right' },
          ],
        },
        {
          name: 'startPercent',
          type: 'number',
          label: 'Scroll Start Trigger (0 to 100%)',
          defaultValue: 10,
        },
        {
          name: 'endPercent',
          type: 'number',
          label: 'Scroll End Trigger (0 to 100%)',
          defaultValue: 40,
        },
        {
          name: 'linkText',
          type: 'text',
          label: 'Action Button Text (Optional)',
        },
        {
          name: 'linkUrl',
          type: 'text',
          label: 'Action Button Link (Optional)',
        },
      ],
    },
  ],
};
