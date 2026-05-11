// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "utfs.io", // Allow images from UploadThing
//       },
//     ],
//   },
// };

// export default nextConfig;


import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // 👈 CRITICAL: Allows sending large images to the server
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);