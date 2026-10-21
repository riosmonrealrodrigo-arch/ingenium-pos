/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'images.unsplash.com',
      'cllrleatfeweyhbpyywo.supabase.co'
    ],
  },
};

module.exports = nextConfig;
