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

export default function Home() {
  const { ready, authenticated, logout, user } = usePrivy();
  const router = useRouter();
  // const walletAddress = user?.wallet?.address || null;
  const walletAddress = "0xe3c17d8E80Ea53a75fC42AFbE685c845394ADB64";

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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {!authenticated ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold mb-8 text-white">Welcome</h1>
          <ConnectButton />
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <div className="text-2xl font-bold text-center">
            Welcome to your Privy Webapp
          </div>

          {/* Transaction History */}
          <div className="w-full max-w-4xl mx-auto p-4">
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
                            href={`https://flare-explorer.flare.network/tx/${tx.hash}`}
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

          {/* Clan buttons */}
          <div className="flex flex-col gap-2 items-center">
            {clans.map((clan) => (
              <a
                key={clan.id}
                href={`/clans/${clan.id}`}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {clan.name}
              </a>
            ))}
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mx-auto"
          >
            Logout
          </button>
        </div>
      )}
    </main>
  );
}
