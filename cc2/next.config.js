/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "rb.gy",
      "images.pexels.com",
      "www.pexels.com",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "cloudflare-ipfs.com",
      "loremflickr.com",
      "utfs.io",
      "uploadthing.com",
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // CDN Configuration (uncomment when CDN is set up)
  // assetPrefix: process.env.CDN_URL || '',
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  // Optimize builds
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
