/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'poggers123.sgp1.digitaloceanspaces.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'poggers123.sgp1.digitaloceanspaces.com',
        pathname: '/gradcam/**',
      },
    ],
    domains: [
      'poggers123.sgp1.digitaloceanspaces.com',
    ],
  },
};

export default nextConfig;
