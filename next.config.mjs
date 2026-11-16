import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    const token = process.env.BLOB_READ_WRITE_TOKEN || ''
    const storeId = token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
    if (!storeId) return []
    return [
      {
        source: '/api/media/file/:filename',
        destination: `https://${storeId}.public.blob.vercel-storage.com/:filename`,
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
        ],
      },
      {
        // Always serve fresh API responses so on-demand frontend ISR revalidation gets updated CMS data immediately
        source: '/api/:path(families.*|products.*|globals/home-page.*|categories.*|news.*|awards.*|projects.*|catalogs.*|videos.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        source: '/media/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
