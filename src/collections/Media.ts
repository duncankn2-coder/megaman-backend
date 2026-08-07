import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'public/media',
    mimeTypes: [
      'image/*',
      'image/svg+xml',
      'video/*',
      'application/pdf',
      'text/plain',
      'application/octet-stream',
      'application/zip',
      'application/x-zip-compressed',
    ],
    adminThumbnail: ({ doc }) => (doc?.mimeType === 'image/svg+xml' ? (doc.url as string) : null),
  },
  access: {
    read: () => true, // Allow anyone to read products
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Optional description or caption for this media item (displayed below image on family pages)',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Document', value: 'document' },
      ],
      defaultValue: 'image',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
