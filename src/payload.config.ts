import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
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
import { Awards } from './collections/Awards'
import { Catalogs } from './collections/Catalogs'
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
  collections: [Users, Media, Products, Projects, Categories, Families, News, Symbols, Skus, Videos, Awards, Catalogs],
  globals: [HomePage],
  cors: [
    'http://localhost:3001',
    'https://megaman-frontend.vercel.app',
    'https://megamanuk.com',
    'https://www.megamanuk.com',
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
  upload: {
    limits: {
      fileSize: 30 * 1024 * 1024, // 30MB max multipart body size to comfortably support 15MB uploads
    },
    useTempFiles: true,
  },
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_DEFAULT_FROM_ADDRESS || 'noreply@neonlite.com.hk',
    defaultFromName: process.env.RESEND_DEFAULT_FROM_NAME || 'MEGAMAN® Lighting CMS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    (async (incomingConfig: any) => {
      const token = process.env.BLOB_READ_WRITE_TOKEN || ''
      const storeId = token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
      const baseUrl = storeId ? `https://${storeId}.public.blob.vercel-storage.com` : ''

      const basePlugin = vercelBlobStorage({
        enabled: !!token,
        collections: {
          media: true,
        },
        token,
        clientUploads: true,
        addRandomSuffix: true,
      })

      const config = await basePlugin(incomingConfig)

      const mediaColl = config.collections?.find((c: any) => c.slug === 'media')
      if (mediaColl && typeof mediaColl.upload === 'object' && Array.isArray(mediaColl.upload.handlers)) {
        const origHandler = mediaColl.upload.handlers[0]
        if (origHandler) {
          mediaColl.upload.handlers[0] = (async (req: any, args: any): Promise<any> => {
            const rawFilename = args?.params?.filename
            if (rawFilename) {
              try {
                // Decode percent-encoded filename (e.g. %20 -> space) so staticHandler's encodeURIComponent doesn't double-encode it to %2520
                args.params.filename = decodeURIComponent(rawFilename)
              } catch {
                // ignore
              }
            }

            try {
              const res = await origHandler(req, args)
              if (res && res.status === 200) {
                return res
              }
            } catch {
              // fallback to direct fetch below
            }

            // If origHandler returned 404 or threw, attempt direct fetch from Vercel Blob CDN to avoid returning an empty 0-byte buffer
            if (baseUrl && rawFilename) {
              try {
                const cleanKey = encodeURIComponent(decodeURIComponent(rawFilename))
                const directUrl = `${baseUrl}/${cleanKey}`
                const directRes = await fetch(directUrl, { cache: 'no-store' })
                if (directRes.ok) {
                  const bodyBuffer = await directRes.arrayBuffer()
                  return new Response(bodyBuffer, {
                    status: 200,
                    headers: {
                      'Content-Type': directRes.headers.get('Content-Type') || 'application/octet-stream',
                    },
                  })
                }
              } catch {
                // direct fetch failed
              }
            }

            return undefined
          }) as any
        }
      }

      return config
    }) as any,
  ],
})
