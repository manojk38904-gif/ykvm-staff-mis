/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
