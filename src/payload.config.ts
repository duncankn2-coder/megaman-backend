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
  },
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_DEFAULT_FROM_ADDRESS || 'noreply@neonlite.com.hk',
    defaultFromName: process.env.RESEND_DEFAULT_FROM_NAME || 'MEGAMAN® Lighting CMS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    async (incomingConfig) => {
      const token = process.env.BLOB_READ_WRITE_TOKEN || ''
      const storeId = token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
      const baseUrl = storeId ? `https://${storeId}.public.blob.vercel-storage.com` : ''

      const basePlugin = vercelBlobStorage({
        enabled: !!token,
        collections: {
          media: {
            disablePayloadAccessControl: true,
          },
        },
        token,
        clientUploads: true,
      })

      const config = await basePlugin(incomingConfig)
      if (!token || !baseUrl) {
        return config
      }

      return {
        ...config,
        collections: (config.collections || []).map((collection) => {
          if (collection.slug !== 'media') return collection

          const existingBeforeChange = [...(collection.hooks?.beforeChange || [])]
          const cloudStorageBeforeChange = existingBeforeChange.pop()

          const fastBeforeChange = async (args: any) => {
            const { data, originalDoc, req } = args
            // If clientUploads already uploaded the exact unmodified file to Vercel Blob, skip re-uploading it
            if (
              !originalDoc &&
              req &&
              (req as any).__skipVercelBlobReupload &&
              data?.filename === (req as any).__skipVercelBlobReupload &&
              (!req.payloadUploadSizes || Object.keys(req.payloadUploadSizes).length === 0)
            ) {
              return data
            }
            if (cloudStorageBeforeChange) {
              return cloudStorageBeforeChange(args)
            }
            return data
          }

          const fastHandler = async (req: any, args: any) => {
            const filename = args?.params?.filename
            if (!filename) return null
            const fileUrl = `${baseUrl}/${encodeURIComponent(filename)}`

            // Direct GET /api/media/file/:filename requests redirect straight to the Vercel Blob CDN
            if (!('clientUploadContext' in (args?.params || {}))) {
              return Response.redirect(fileUrl, 307)
            }

            // Internal fetch during POST /api/media after clientUpload
            const reqUrl = req?.url || ''
            const hasUploadEdits = reqUrl.includes('uploadEdits')
            const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase().split('?')[0] : ''
            const basePart = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename
            // Check if filename contains characters that sanitize-filename would alter
            const hasUnsafeChars = /[<>:"/\\|?*\x00-\x1F]/.test(basePart)

            let existingDoc = null
            if (!hasUploadEdits && !hasUnsafeChars && req?.payload?.db?.findOne) {
              try {
                existingDoc = await req.payload.db.findOne({
                  collection: 'media',
                  req,
                  where: { filename: { equals: filename } },
                })
              } catch {
                // ignore and fall back to full fetch
              }
            }

            const canSkipFullTransfer = !hasUploadEdits && !hasUnsafeChars && !existingDoc

            if (canSkipFullTransfer) {
              ;(req as any).__skipVercelBlobReupload = filename

              // Non-image files (PDF, ZIP, LDT, IES, etc.) do not need their buffer inspected on the server at all
              const isImageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'tiff', 'jxl'].includes(ext)
              if (!isImageExt) {
                return new Response(new Uint8Array(0), { status: 200 })
              }

              // For PNG, reading the first 64KB is always enough to extract width & height without downloading multi-MB files
              if (ext === 'png') {
                const rangeRes = await fetch(fileUrl, {
                  headers: { Range: 'bytes=0-65535' },
                })
                if (rangeRes.ok || rangeRes.status === 206) {
                  const buf = await rangeRes.arrayBuffer()
                  return new Response(buf, {
                    status: 200,
                    headers: { 'Content-Type': 'image/png' },
                  })
                }
              }
            }

            // Fetch directly from CDN (skipping the slow head() API call in default staticHandler)
            const response = await fetch(fileUrl)
            if (!response.ok) {
              return new Response(null, { status: response.status })
            }
            const bodyBuffer = await response.arrayBuffer()
            return new Response(bodyBuffer, {
              status: 200,
              headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
              },
            })
          }

          return {
            ...collection,
            hooks: {
              ...(collection.hooks || {}),
              beforeChange: [...existingBeforeChange, fastBeforeChange],
            },
            upload: {
              ...(typeof collection.upload === 'object' ? collection.upload : {}),
              handlers: [fastHandler],
            },
          }
        }),
      }
    },
  ],
})
