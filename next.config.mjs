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


/** @type {import('next').NextConfig} */
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
        hostname: "**", // Allows rendering images from any URL (useful if you switch storage later)
      },
    ],
  },
};

export default nextConfig;