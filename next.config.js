/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone mode for optimized Docker deployment
  output: 'standalone',

  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,

  // Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_NAME: 'AI Chat',
  },
};

module.exports = nextConfig;
