/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Skip static generation for dynamic routes that need database access
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;
