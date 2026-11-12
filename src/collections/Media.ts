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
      'application/x-zip',
      'multipart/x-zip',
    ],
    adminThumbnail: ({ doc }) => (doc?.mimeType === 'image/svg+xml' ? (doc.url as string) : null),
  },
  access: {
    read: () => true, // Allow anyone to read products
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15MB
        const file = (req as any)?.file;
        const mimeType = file?.mimetype || data?.mimeType;
        const fileSize = file?.size || data?.filesize;

        if (mimeType === 'application/pdf' && fileSize && fileSize > MAX_PDF_SIZE) {
          const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
          throw new Error(
            `The uploaded PDF is ${sizeMB}MB, which exceeds the 15MB limit. Please upload a PDF smaller than 15MB.`
          );
        }

        if (mimeType === 'application/pdf' && data && !data.type) {
          data.type = 'document';
        }

        return data;
      },
    ],
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
