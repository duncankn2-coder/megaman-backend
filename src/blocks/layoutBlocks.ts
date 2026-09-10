import { Block, Field } from 'payload';

export const titleStyleFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'titleColor',
        type: 'select',
        label: 'Title Color',
        defaultValue: 'default',
        admin: { width: '50%' },
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Dark (#111827)', value: 'dark' },
          { label: 'White (#FFFFFF)', value: 'white' },
          { label: 'Megaman Blue (#005288)', value: 'blue' },
          { label: 'Muted Gray (#6B7280)', value: 'muted' },
          { label: 'Custom Hex', value: 'custom' },
        ],
      },
      {
        name: 'titleCustomColor',
        type: 'text',
        label: 'Custom Title Color (Hex, e.g. #FF5500)',
        admin: {
          width: '50%',
          condition: (data, siblingData) => siblingData?.titleColor === 'custom',
        },
      },
    ],
  },
  {
    name: 'titleSize',
    type: 'select',
    label: 'Title Size',
    defaultValue: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Small (24px)', value: 'sm' },
      { label: 'Medium (30px)', value: 'md' },
      { label: 'Large (36px)', value: 'lg' },
      { label: 'Extra Large (48px)', value: 'xl' },
      { label: 'Huge (60px)', value: '2xl' },
    ],
  },
];

export const subtitleStyleFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'subtitleColor',
        type: 'select',
        label: 'Subtitle Color',
        defaultValue: 'default',
        admin: { width: '50%' },
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Megaman Blue (#005288)', value: 'blue' },
          { label: 'Dark (#111827)', value: 'dark' },
          { label: 'White (#FFFFFF)', value: 'white' },
          { label: 'Muted Gray (#6B7280)', value: 'muted' },
          { label: 'Custom Hex', value: 'custom' },
        ],
      },
      {
        name: 'subtitleCustomColor',
        type: 'text',
        label: 'Custom Subtitle Color (Hex, e.g. #FF5500)',
        admin: {
          width: '50%',
          condition: (data, siblingData) => siblingData?.subtitleColor === 'custom',
        },
      },
    ],
  },
  {
    name: 'subtitleSize',
    type: 'select',
    label: 'Subtitle Size',
    defaultValue: 'default',
    options: [
      { label: 'Default (10px tracking-widest)', value: 'default' },
      { label: 'Small (12px)', value: 'sm' },
      { label: 'Medium (14px)', value: 'md' },
      { label: 'Large (16px)', value: 'lg' },
    ],
  },
];

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
          required: false,
        },
        {
          name: 'hideTitle',
          type: 'checkbox',
          label: 'Hide Slide Title',
          defaultValue: false,
        },
        ...titleStyleFields,
        {
          name: 'subtitle',
          type: 'text',
          label: 'Slide Subtitle / Category Label',
          required: false,
        },
        ...subtitleStyleFields,
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
          name: 'hideButton',
          type: 'checkbox',
          label: 'Hide Button (CTA)',
          defaultValue: false,
        },
        {
          name: 'ctaText',
          type: 'text',
          label: 'Button text (CTA)',
          defaultValue: 'EXPLORE RANGE',
          required: false,
          admin: {
            condition: (data, siblingData) => !siblingData?.hideButton,
          },
        },
        {
          name: 'ctaLink',
          type: 'text',
          label: 'Banner link URL (Click banner to navigate)',
          defaultValue: '#categories-section',
          required: false,
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
      required: false,
    },
    {
      name: 'hideTitle',
      type: 'checkbox',
      label: 'Hide Section Title',
      defaultValue: false,
    },
    ...titleStyleFields,
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      defaultValue: 'PORTFOLIO OVERVIEW',
      required: false,
    },
    ...subtitleStyleFields,
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
      required: false,
    },
    {
      name: 'hideTitle',
      type: 'checkbox',
      label: 'Hide Section Title',
      defaultValue: false,
    },
    ...titleStyleFields,
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Category Subtitle',
      required: false,
    },
    ...subtitleStyleFields,
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
      required: false,
    },
    {
      name: 'hideTitle',
      type: 'checkbox',
      label: 'Hide Section Title',
      defaultValue: false,
    },
    ...titleStyleFields,
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      defaultValue: 'PREMIUM SELECTIONS',
      required: false,
    },
    ...subtitleStyleFields,
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
      required: false,
    },
    {
      name: 'hideTitle',
      type: 'checkbox',
      label: 'Hide Section Title',
      defaultValue: false,
    },
    ...titleStyleFields,
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      defaultValue: 'PROJECTS & REFERENCES',
      required: false,
    },
    ...subtitleStyleFields,
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
      required: false,
    },
    {
      name: 'hideTitle',
      type: 'checkbox',
      label: 'Hide Section Title',
      defaultValue: false,
    },
    ...titleStyleFields,
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Subtitle',
      defaultValue: 'PRESS & MEDIA',
      required: false,
    },
    ...subtitleStyleFields,
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
      required: false,
    },
    {
      name: 'hideTitle',
      type: 'checkbox',
      label: 'Hide Section Title',
      defaultValue: false,
    },
    ...titleStyleFields,
    {
      name: 'subtitle',
      type: 'text',
      label: 'Section Category Subtitle',
      required: false,
    },
    ...subtitleStyleFields,
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
          required: false,
        },
        {
          name: 'hideTitle',
          type: 'checkbox',
          label: 'Hide Caption Title',
          defaultValue: false,
        },
        ...titleStyleFields,
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
