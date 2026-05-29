/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone output is highly recommended for Docker builds to optimize bundle size
  output: 'standalone',
  images: {
    domains: ['localhost', 'remoteweb3.com'],
  },
}

module.exports = nextConfig
