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
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },

  // Optimize imports for better tree-shaking
  // Note: framer-motion removed from modularizeImports - use optimizePackageImports instead
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    optimizePackageImports: ['framer-motion', 'lucide-react', '@portabletext/react', 'sanity', '@sanity/ui', '@sanity/icons'],
  },

  // Transpile Sanity packages for better optimization
  // recharts + deps: avoids webpack factory errors when dynamically imported on the client
  transpilePackages: [
    'sanity', '@sanity/ui', '@sanity/icons', '@sanity/vision', 'next-sanity',
    'recharts', 'react-smooth', 'recharts-scale',
  ],

  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.externals = [...config.externals, { canvas: 'canvas' }];

    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Initial-page vendor chunk only — 'all' breaks Next.js dynamic import() chunks.
            // Exclude recharts/d3 so they stay in dedicated async chunks.
            vendor: {
              name: 'vendor',
              chunks: 'initial',
              test: (module) => {
                const ctx = module.context ?? '';
                if (!/[\\/]node_modules[\\/]/.test(ctx)) return false;
                return !/[\\/]node_modules[\\/](recharts|react-smooth|recharts-scale|d3-|victory-vendor)[\\/]/.test(ctx);
              },
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'initial',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: 'async',
              priority: 30,
            },
            // Separate chunk for Sanity Studio (large bundle)
            sanity: {
              name: 'sanity',
              test: /[\\/]node_modules[\\/](@sanity|sanity)[\\/]/,
              chunks: 'async',
              priority: 40,
              enforce: true,
            },
            // Separate chunk for Supabase (only needed for ctroom and likes)
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              chunks: 'async',
              priority: 35,
              enforce: true,
            },
            // Separate chunk for Radix UI components
            radix: {
              name: 'radix',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              chunks: 'async',
              priority: 25,
            },
            // recharts must stay in its own async chunk — bundling it into the
            // main vendor chunk breaks dynamic() imports (webpack "reading 'call'" error)
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/](recharts|react-smooth|recharts-scale|d3-[^/]+|victory-vendor)[\\/]/,
              chunks: 'async',
              priority: 45,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig)
