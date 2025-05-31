import type { NextConfig } from "next";
    
const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ['@privy-io/react-auth', '@blockscout/app-sdk', 'styled-components'], // Keep styled-components here for now
  // Webpack alias for styled-components removed for now
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // WARNING: 'unsafe-eval' reduces security. Use with caution.
            // This policy allows 'unsafe-eval' for scripts and specifies frame and connect sources.
            // Added 'https:' and '*' to img-src for broader image loading compatibility during development.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: *; font-src 'self' data:; frame-src 'self' https://auth.privy.io; connect-src 'self' https://flare-explorer.flare.network https://polygon-rpc.com https://mainnet.evm.nodes.onflow.org https://flare-api.flare.network/ext/C/rpc https://rpc.ankr.com/flare https://auth.privy.io https://*.privy.io wss://*.privy.io https://explorer-api.walletconnect.com;",
          },
        ],
      },
    ];
  },
};
    
export default nextConfig;
