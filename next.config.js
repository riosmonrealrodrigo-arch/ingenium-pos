const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  optimizeFonts: false,
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'images.unsplash.com',
      'cllrleatfeweyhbpyywo.supabase.co'
    ],
  },
};

module.exports = nextConfig;
