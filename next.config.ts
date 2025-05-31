import type { NextConfig } from "next";
    
const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // WARNING: 'unsafe-eval' reduces security. Use with caution.
            // This policy allows 'unsafe-eval' for scripts.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://flare-explorer.flare.network https://polygon-rpc.com https://mainnet.evm.nodes.onflow.org https://flare-api.flare.network/ext/C/rpc https://rpc.ankr.com/flare https://auth.privy.io https://*.privy.io wss://*.privy.io;",
          },
        ],
      },
    ];
  },
};
    
export default nextConfig;
