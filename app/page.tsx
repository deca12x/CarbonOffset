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
import { useRef, useEffect } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function Home() {
  const { ready, authenticated, logout, user } = usePrivy();
  const router = useRouter();
  // const walletAddress = user?.wallet?.address || null;
  const walletAddress = "0xe3c17d8E80Ea53a75fC42AFbE685c845394ADB64";
  const backgroundRef = useRef<HTMLDivElement>(null);

  const {
    data: transactions,
    isLoading: txLoading,
    error: txError,
  } = useQuery({
    queryKey: ["transactions", walletAddress],
    queryFn: () =>
      walletAddress
        ? fetchTransactionHistory(walletAddress)
        : Promise.resolve([]),
    enabled: !!walletAddress,
  });

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
    </main>
  );
}
