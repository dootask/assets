import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.NEXT_OUTPUT_MODE === 'standalone' ? 'standalone' : undefined,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // 配置API代理
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9988/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
