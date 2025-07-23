import withPWA from 'next-pwa';
import type { NextConfig } from 'next'; // optional now
import type { Configuration } from 'webpack';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ] as RemotePattern[],
  },
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    // custom webpack config
    return config;
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
