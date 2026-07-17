import { CollectionConfig } from 'payload';

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
    return url;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export const Videos: CollectionConfig = {
  slug: 'videos',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'youtubeLink'],
  },
  access: {
    read: () => true, // Allow anyone to read videos
    create: ({ req }) => !!req.user, // Only authenticated users can create
    update: ({ req }) => !!req.user, // Only authenticated users can update
    delete: ({ req }) => !!req.user, // Only authenticated users can delete
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && data.youtubeLink) {
          const id = getYouTubeId(data.youtubeLink);
          if (id) {
            data.youtubeId = id;
          } else {
            data.youtubeId = '';
          }
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
      name: 'description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'youtubeLink',
      type: 'text',
      required: true,
      label: 'YouTube Video Link',
      admin: {
        description: 'Pasted YouTube video URL (e.g., https://www.youtube.com/watch?v=E8vXpMvPILk or https://youtu.be/E8vXpMvPILk)',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'YouTube Link is required';
        const id = getYouTubeId(value);
        if (!id) {
          return 'Please enter a valid YouTube video URL or 11-digit video ID.';
        }
        return true;
      },
    },
    {
      name: 'youtubeId',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        description: 'Auto-extracted YouTube video ID',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Corporate', value: 'Corporate' },
        { label: 'Smart Lighting', value: 'Smart Lighting' },
        { label: 'Installation', value: 'Installation' },
        { label: 'Case Study', value: 'Case Study' },
        { label: 'Sustainability', value: 'Sustainability' },
        { label: 'Technical', value: 'Technical' },
      ],
    },
    {
      name: 'duration',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. 3:42, 4:15, or 6:28',
      },
    },
  ],
};
