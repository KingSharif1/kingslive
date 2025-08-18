/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  // Add any other Next.js config options here
}

module.exports = nextConfig
