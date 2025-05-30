"use client";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { createConfig, WagmiProvider } from "wagmi";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { http } from "wagmi";
import { defineChain } from "viem";
import {
  NotificationProvider,
  TransactionPopupProvider,
} from "@blockscout/app-sdk";

const polygonMainnet = defineChain({
  id: 137,
  name: "Polygon Mainnet",
  network: "polygon",
  nativeCurrency: { name: "Polygon", symbol: "POL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://polygon-rpc.com"] },
  },
});

const flowMainnet = defineChain({
  id: 747,
  name: "Flow Mainnet",
  network: "flow",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 8 },
  rpcUrls: {
    default: { http: ["https://rest-mainnet.onflow.org"] },
  },
});

const flareMainnet = defineChain({
  id: 14,
  name: "Flare Mainnet",
  network: "flare",
  nativeCurrency: { name: "Flare", symbol: "FLR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://flare-api.flare.network/ext/C/rpc"] },
  },
});

const wagmiConfig = createConfig({
  chains: [polygonMainnet, flowMainnet, flareMainnet],
  transports: {
    [polygonMainnet.id]: http(),
    [flowMainnet.id]: http(),
    [flareMainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <TransactionPopupProvider>
          <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
            config={{
              appearance: {
                theme: "light",
                accentColor: "#676FFF",
                logo: "/globe.svg",
              },
              loginMethods: ["wallet"],
              defaultChain: flowMainnet,
              supportedChains: [
                {
                  id: 137,
                  name: "Polygon Mainnet",
                  nativeCurrency: {
                    name: "Polygon",
                    symbol: "POL",
                    decimals: 18,
                  },
                  rpcUrls: {
                    default: { http: ["https://polygon-rpc.com"] },
                  },
                },
                {
                  id: 747,
                  name: "Flow Mainnet",
                  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 8 },
                  rpcUrls: {
                    default: { http: ["https://mainnet.evm.nodes.onflow.org"] },
                  },
                },
                {
                  id: 14,
                  name: "Flare Mainnet",
                  nativeCurrency: {
                    name: "Flare",
                    symbol: "FLR",
                    decimals: 18,
                  },
                  rpcUrls: {
                    default: { http: [" https://rpc.ankr.com/flare"] },
                  },
                },
              ],
            }}
          >
            <WagmiProvider config={wagmiConfig}>
              <NuqsAdapter>{children}</NuqsAdapter>
            </WagmiProvider>
          </PrivyProvider>
        </TransactionPopupProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}
