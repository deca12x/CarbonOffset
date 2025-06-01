// app/page.tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { clans } from "@/lib/data";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactionHistory } from "@/lib/TransactionHistory";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";
import { useRef, useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { formatUnits } from "viem";
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";

// Initialize the public client for Polygon
const publicClient = createPublicClient({
  chain: polygon,
  transport: http(),
});

// ABI for ERC20 balanceOf function
const erc20ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Constants
const NCT_CONTRACT_ADDRESS = "0xd838290e877e0188a4a44700463419ed96c16107";
const walletWithNctOnPolygon = "0x6998FE700015f04FB192f46Ec1DcB59320334f4B";

const nctContractABI = [
  {
    inputs: [
      { internalType: "address", name: "_logic", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  { stateMutability: "payable", type: "fallback" },
  { stateMutability: "payable", type: "receive" },
] as const;

async function fetchUSDCtoCHARRatio() {
  try {
    const ratio = await publicClient.readContract({
      address: NCT_CONTRACT_ADDRESS as `0x${string}`,
      abi: nctContractABI,
      functionName: "getUSDCtoCHARRatio",
    });
    return ratio;
  } catch (error) {
    console.error("Error fetching USDC-to-CHAR ratio:", error);
    return null;
  }
}

export default function Home() {
  const { ready, authenticated, logout, user } = usePrivy();
  const router = useRouter();
  // const walletOfUser = user?.wallet?.address || null;
  const walletSearched = "0xe3c17d8E80Ea53a75fC42AFbE685c845394ADB64";
  const backgroundRef = useRef<HTMLDivElement>(null);

  const {
    data: transactions,
    isLoading: txLoading,
    error: txError,
  } = useQuery({
    queryKey: ["transactions", walletSearched],
    queryFn: () =>
      walletSearched
        ? fetchTransactionHistory(walletSearched)
        : Promise.resolve([]),
    enabled: !!walletSearched,
  });

  const [nctBalance, setNctBalance] = useState<string>("0");
  const [nctLoading, setNctLoading] = useState(true);
  const [nctError, setNctError] = useState(false);

  useEffect(() => {
    const fetchNCTBalance = async () => {
      try {
        setNctLoading(true);
        const balance = await publicClient.readContract({
          address: NCT_CONTRACT_ADDRESS as `0x${string}`,
          abi: erc20ABI,
          functionName: "balanceOf",
          args: [walletWithNctOnPolygon as `0x${string}`],
        });
        setNctBalance(balance.toString());
      } catch (error) {
        console.error("Error fetching NCT balance:", error);
        setNctError(true);
      } finally {
        setNctLoading(false);
      }
    };

    fetchNCTBalance();
  }, []);

  useEffect(() => {
    // Add a class to the body when authenticated to help with styling
    if (authenticated) {
      document.body.classList.add("is-authenticated");
    } else {
      document.body.classList.remove("is-authenticated");
    }
  }, [authenticated]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen">
      <div ref={backgroundRef} className="fixed inset-0 z-0 w-screen h-screen">
        <AnimatedBackground />
      </div>

      {/* Content sections */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-white">
        <h1 className="text-6xl font-bold mb-4">Carbon Offset</h1>
        <p className="text-xl mb-8">Your platform for carbon credit trading</p>
        <ConnectButton />
      </div>

      {/* Transaction History */}
      {authenticated && (
        <div className="relative z-10 container mx-auto px-4 py-20 text-white">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          {txLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : txError ? (
            <div className="text-red-500 p-4">
              Error loading transactions. Please try again later.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gas Used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions?.map((tx) => (
                    <tr key={tx.hash}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <a
                          href={`https://blockscout.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(
                          new Date(parseInt(tx.timestamp) * 1000),
                          {
                            addSuffix: true,
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.gasUsed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* NCT Token Balance */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-white">
        <h2 className="text-xl font-bold mb-4">NCT Token Balance (Polygon)</h2>
        <div className="overflow-x-auto">
          <div className="bg-white rounded-lg overflow-hidden p-6">
            <div className="flex flex-col gap-2">
              <div className="text-gray-500 text-sm">Wallet Address</div>
              <div className="text-gray-700 font-mono break-all">
                {walletWithNctOnPolygon}
              </div>
              <div className="text-gray-500 text-sm mt-4">NCT Balance</div>
              {nctLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-gray-700">Loading balance...</span>
                </div>
              ) : nctError ? (
                <div className="text-red-500">
                  Error loading NCT balance. Please try again later.
                </div>
              ) : (
                <div className="text-gray-700 font-mono">
                  {formatUnits(BigInt(nctBalance), 18)} NCT
                </div>
              )}
              <div className="mt-4">
                <a
                  href={`https://polygonscan.blockscout.com/token/${NCT_CONTRACT_ADDRESS}?a=${walletWithNctOnPolygon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View on Blockscout →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
