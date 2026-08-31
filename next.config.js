const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable source maps in production for faster builds and smaller bundles
  productionBrowserSourceMaps: false,

  // Enable gzip compression
  compress: true,

  // Add caching headers for static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Subdomain routing
  async rewrites() {
    return [
      // Blog subdomain handling
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'blog.localhost',
          },
        ],
        destination: '/blog/:path*',
      },
      // Control Room (ctroom) subdomain handling
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ctroom.localhost',
          },
        ],
        destination: '/ctroom/:path*',
      },
      // Alternative Control Room (ctr) subdomain handling
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ctr.localhost',
          },
        ],
        destination: '/ctroom/:path*',
      },
    ]
  },

  // Build optimization settings
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization for better performance
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'fcdzbnuyzdzqkuizvexk.supabase.co',
      },
    ],
  },

  // Optimize imports for better tree-shaking
  // Note: framer-motion removed from modularizeImports - use optimizePackageImports instead
  experimental: {
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },

  transpilePackages: [
    'sanity', '@sanity/ui', '@sanity/icons', '@sanity/vision', 'next-sanity',
    'recharts', 'react-smooth', 'recharts-scale',
  ],

  webpack: (config, { isServer }) => {
    // jsdom/Sanity pulls `canvas` on the server only. Externalizing it on the
    // client makes webpack factories undefined ("reading 'call'").
    if (isServer) {
      const prev = config.externals
      config.externals = Array.isArray(prev) ? [...prev, { canvas: 'canvas' }] : [prev, { canvas: 'canvas' }]
    }
    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)
