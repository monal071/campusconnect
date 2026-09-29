/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "rb.gy" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "www.pexels.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cloudflare-ipfs.com" },
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "uploadthing.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  async redirects() {
    return [
      {
        source: "/resource",
        destination: "/resources",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
