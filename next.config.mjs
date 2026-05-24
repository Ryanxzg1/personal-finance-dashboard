/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Ensure strict build mode (TASK-1.2.1 previously completed, but keeping it explicit)
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.clerk.accounts.dev https://img.clerk.com; font-src 'self' data:; connect-src 'self' https://*.clerk.accounts.dev https://*.neon.tech; worker-src 'self' blob:; frame-src 'self' https://*.clerk.accounts.dev; upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
