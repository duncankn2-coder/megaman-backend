import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Projects } from './collections/Projects'
import { Families } from './collections/Families'
import { Categories } from './collections/Categories'
import { News } from './collections/News'
import { Symbols } from './collections/Symbols'
import { Skus } from './collections/Skus'
import { Videos } from './collections/Videos'
import { HomePage } from './globals/HomePage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: [
        '/components/BulkImportLink#BulkImportLink'
      ],
    },
  },
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  collections: [Users, Media, Products, Projects, Categories, Families, News, Symbols, Skus, Videos],
  globals: [HomePage],
  cors: [
    'http://localhost:3001',
    'https://megaman-frontend.vercel.app',
    process.env.PAYLOAD_PUBLIC_FRONTEND_URL || '',
  ].filter(Boolean),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    vercelBlobStorage({
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
