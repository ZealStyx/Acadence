import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Firebase Google sign-in uses a popup. Allow the opener relationship with it.
  // This intentionally does not enable cross-origin isolation.
  async headers() {
    return [{source:'/:path*', headers:[{key:'Cross-Origin-Opener-Policy', value:'same-origin-allow-popups'}]}];
  },
};

export default nextConfig;
