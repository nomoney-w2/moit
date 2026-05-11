import type { NextConfig } from 'next';
import path from 'path';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_BASE_URL is not defined. ' +
      'Set it in .env.development for local dev or in Vercel environment variables for deployment.',
  );
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/proxy-api/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
