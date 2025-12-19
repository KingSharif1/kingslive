const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable source maps in production for faster builds and smaller bundles
  productionBrowserSourceMaps: false,

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
  modularizeImports: {
    'framer-motion': {
      transform: 'framer-motion/dist/es/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    optimizePackageImports: ['framer-motion', 'lucide-react', '@portabletext/react'],
  },

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
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate chunk for framer-motion
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 30,
            },
          },
        },
      };
    }

    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig)
