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
            // Consider if specific hashes or nonces can be used if the source of eval is known.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://flare-explorer.flare.network https://polygon-rpc.com https://mainnet.evm.nodes.onflow.org https://flare-api.flare.network https://rpc.ankr.com https://auth.privy.io https://*.privy.io wss://*.privy.io;",
            // Added connect-src for various APIs used. 'unsafe-inline' is often needed for styles with CSS-in-JS or dev tools.
          },
        ],
      },
    ];
  },
};
    
export default nextConfig;
