import type { NextConfig } from "next";
    
const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ['styled-components', '@privy-io/react-auth', '@blockscout/app-sdk'],
  webpack: (config, { isServer }) => {
    // Add an alias for styled-components to ensure the correct version is resolved.
    // This points to the main CJS entry point for styled-components v5.
    // Adjust the path if your node_modules structure or styled-components version differs significantly,
    // but for v5, 'styled-components/dist/styled-components.cjs.js' is a common path for the CJS build.
    // Or simply 'styled-components' if the override in package.json is expected to work.
    config.resolve.alias = {
      ...config.resolve.alias,
      'styled-components': require.resolve('styled-components'),
    };
    return config;
  },
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
