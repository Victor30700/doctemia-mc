// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Dominios fijos
    domains: [
      's3.ppllstatics.com',
      'firebasestorage.googleapis.com',
      'fiverr-res.cloudinary.com',
    ],
    // Patrones remotos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tse4.mm.bing.net',
        port: '',
        pathname: '/**',
      },
      // Añade más remotePatterns aquí si lo necesitas
    ],
  },
  webpack(config) {
    // alias @ → ./src
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
