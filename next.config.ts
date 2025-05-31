import type { NextConfig } from "next";
    
const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ['@privy-io/react-auth', '@blockscout/app-sdk'],
  compiler: {
    styledComponents: true, // Enable Next.js compiler support for styled-components
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const cspHeaderValue = isDevelopment
      ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
      : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: *; font-src 'self' data:; frame-src 'self' https://auth.privy.io; connect-src 'self' https://flare-explorer.flare.network https://polygon-rpc.com https://mainnet.evm.nodes.onflow.org https://flare-api.flare.network/ext/C/rpc https://rpc.ankr.com/flare https://auth.privy.io https://*.privy.io wss://*.privy.io https://explorer-api.walletconnect.com;";

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeaderValue,
          },
        ],
      },
    ];
  },
};
    
export default nextConfig;
