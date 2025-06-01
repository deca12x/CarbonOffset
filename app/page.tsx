// app/page.tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import {
  Loader2,
  TrendingUp,
  Leaf,
  Globe,
  ArrowRight,
  History,
  Coins,
  UserCircle,
  BarChart3,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactionHistory } from "@/lib/TransactionHistory";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";
import AddressInput from "@/components/AddressInput";
import { useRef, useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CrossChainMonitor } from "@/components/CrossChainMonitor";
import { formatUnits } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Constants
const NCT_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const POLYGON_CHAIN_ID = "137";

// Function to fetch token balance using direct RPC call
const fetchTokenBalance = async (
  address: string,
  tokenAddress: string
): Promise<string> => {
  try {
    // Use direct RPC call to get token balance
    const rpcUrl = "https://polygon-rpc.com";

    // ERC20 balanceOf function signature: balanceOf(address)
    const functionSignature = "0x70a08231"; // balanceOf function selector
    const paddedAddress = address.slice(2).padStart(64, "0"); // Remove 0x and pad to 32 bytes
    const data = functionSignature + paddedAddress;

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: data,
          },
          "latest",
        ],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC call failed: ${result.error.message}`);
    }

    // Convert hex result to decimal
    const balanceHex = result.result;
    const balance = BigInt(balanceHex || "0x0").toString();

    console.log(`Token balance for ${address}: ${balance}`);
    return balance;
  } catch (error) {
    console.error("Error fetching token balance:", error);

    // Fallback: try alternative RPC endpoint
    try {
      console.log("Trying fallback RPC endpoint...");
      const fallbackRpcUrl = "https://rpc.ankr.com/polygon";

      const functionSignature = "0x70a08231";
      const paddedAddress = address.slice(2).padStart(64, "0");
      const data = functionSignature + paddedAddress;

      const fallbackResponse = await fetch(fallbackRpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: tokenAddress,
              data: data,
            },
            "latest",
          ],
          id: 1,
        }),
      });

      if (fallbackResponse.ok) {
        const fallbackResult = await fallbackResponse.json();
        if (!fallbackResult.error) {
          const balanceHex = fallbackResult.result;
          const balance = BigInt(balanceHex || "0x0").toString();
          console.log(
            `Fallback RPC - Token balance for ${address}: ${balance}`
          );
          return balance;
        }
      }
    } catch (fallbackError) {
      console.error("Fallback RPC also failed:", fallbackError);
    }

    // If all methods fail, return 0 instead of throwing
    console.log("All RPC methods failed, returning 0");
    return "0";
  }
};

export default function Home() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const backgroundRef = useRef<HTMLDivElement>(null);

  const [destinationAddress, setDestinationAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [tempSearchAddress, setTempSearchAddress] = useState("");

  const walletToSearch = searchAddress || user?.wallet?.address || "";

  const {
    data: transactions,
    isLoading: txLoading,
    error: txError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", walletToSearch],
    queryFn: () =>
      walletToSearch
        ? fetchTransactionHistory(walletToSearch)
        : Promise.resolve([]),
    enabled: !!walletToSearch,
  });

  // Use React Query for NCT balance fetching with Blockscout API
  const {
    data: nctBalance,
    isLoading: nctLoading,
    error: nctError,
    refetch: refetchNctBalance,
  } = useQuery({
    queryKey: ["nctBalance", user?.wallet?.address],
    queryFn: () =>
      user?.wallet?.address
        ? fetchTokenBalance(user?.wallet?.address, NCT_CONTRACT_ADDRESS)
        : Promise.resolve("0"),
    enabled: !!authenticated && !!user?.wallet?.address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    if (authenticated) {
      document.body.classList.add("is-authenticated");
      if (user?.wallet?.address && !destinationAddress) {
        setDestinationAddress(user?.wallet?.address);
      }
      if (user?.wallet?.address && !searchAddress) {
        setSearchAddress(user?.wallet?.address);
        setTempSearchAddress(user?.wallet?.address);
      }
    } else {
      document.body.classList.remove("is-authenticated");
    }
  }, [authenticated, user?.wallet?.address, destinationAddress, searchAddress]);

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    setSearchAddress(tempSearchAddress);
    refetchTransactions();
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center space-y-4 p-8 glass-strong rounded-xl">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
          <p className="text-lg font-medium text-primary-foreground">
            Initializing Carbon Offset Platform...
          </p>
          <p className="text-sm text-muted-foreground">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden text-foreground bg-secondary">
      <div ref={backgroundRef} className="fixed inset-0 z-0 w-full h-full">
        <AnimatedBackground />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header Section */}
        <header className="mb-12 md:mb-16 animate-fade-in-up text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-4">
            Carbon Offset
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Your decentralized platform for transparent carbon credit trading
            and real-world environmental impact tracking.
          </p>
          <ConnectButton />
        </header>

        {!authenticated && (
          <div className="text-center py-16 animate-fade-in-up animation-delay-300">
            <Card className="glass-strong max-w-2xl mx-auto p-8">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-center mb-4 gradient-text">
                  Join the Movement
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground text-lg">
                  Connect your wallet to access powerful tools for carbon
                  offsetting and contribute to a greener future.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  {[
                    { icon: Leaf, text: "Trade Carbon Credits" },
                    { icon: Globe, text: "Cross-Chain Bridge" },
                    { icon: BarChart3, text: "Track Your Impact" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center p-4 glass rounded-lg"
                    >
                      <item.icon className="w-10 h-10 text-primary mb-3" />
                      <span className="text-sm font-medium text-foreground">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {authenticated && user && (
          <div className="space-y-10 animate-fade-in-up animation-delay-300">
            {/* Dashboard Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <Card className="glass-strong md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserCircle className="w-6 h-6 text-primary" />
                    Your Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">
                    Connected as:
                  </p>
                  <p className="font-mono text-sm break-all text-primary">
                    {user.wallet?.address}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Coins className="w-6 h-6 text-primary" />
                    NCT Balance
                  </CardTitle>
                  <CardDescription>
                    Balance on Polygon (via RPC)
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  {nctLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">
                        Fetching balance...
                      </p>
                    </div>
                  ) : nctError ? (
                    <div className="text-center">
                      <p className="text-destructive text-sm mb-2">
                        Error fetching balance
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchNctBalance()}
                        className="text-xs"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold gradient-text">
                        {nctBalance
                          ? (parseFloat(nctBalance) / 1e6).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 6 }
                            )
                          : "0"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">NCT</p>
                    </div>
                  )}
                </CardContent>
                {!nctLoading && !nctError && (
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full glass hover:border-primary"
                    >
                      <a
                        href={`https://polygon.blockscout.com/address/${NCT_CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Blockscout <ArrowRight className="ml-2" />
                      </a>
                    </Button>
                  </CardFooter>
                )}
              </Card>

              <div className="md:col-span-2 lg:col-span-1">
                <AddressInput
                  value={destinationAddress}
                  onChange={setDestinationAddress}
                  label="Bridge Destination Address"
                />
              </div>
            </div>

            {/* Transaction History Section */}
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <History className="w-6 h-6 text-primary" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  Displaying transactions for:{" "}
                  <span className="font-mono text-primary">
                    {walletToSearch
                      ? `${walletToSearch.slice(
                          0,
                          10
                        )}...${walletToSearch.slice(-8)}`
                      : "your connected wallet"}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex flex-col sm:flex-row gap-3 mb-6"
                >
                  <Input
                    type="search"
                    placeholder="Enter wallet address to view its history (0x...)"
                    value={tempSearchAddress}
                    onChange={(e) => setTempSearchAddress(e.target.value)}
                    className="font-mono text-sm flex-grow glass-strong placeholder:text-muted-foreground"
                  />
                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full sm:w-auto"
                  >
                    <Search className="mr-2" /> Search
                  </Button>
                  {searchAddress !== user?.wallet?.address &&
                    user?.wallet?.address && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto glass hover:border-primary"
                        onClick={() => {
                          setTempSearchAddress(user.wallet?.address || "");
                          setSearchAddress(user.wallet?.address || "");
                        }}
                      >
                        View My History
                      </Button>
                    )}
                </form>
                {txLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : txError ? (
                  <p className="text-destructive text-center py-6">
                    Error loading transactions. Please try again.
                  </p>
                ) : transactions && transactions.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="p-3 text-left font-semibold text-muted-foreground">
                            Hash
                          </th>
                          <th className="p-3 text-left font-semibold text-muted-foreground">
                            Date
                          </th>
                          <th className="p-3 text-right font-semibold text-muted-foreground">
                            Gas Used
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {transactions.map((tx) => (
                          <tr
                            key={tx.hash}
                            className="hover:bg-white/5 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <a
                                href={`https://flare-explorer.flare.network/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                              </a>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(parseInt(tx.timestamp) * 1000),
                                { addSuffix: true }
                              )}
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground">
                              {tx.gasUsed}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    No transactions found for this address.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cross-Chain Monitor Section */}
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Globe className="w-6 h-6 text-primary" />
                  Cross-Chain Bridge Monitor
                </CardTitle>
                <CardDescription>
                  Track your bridge transactions across multiple blockchain
                  networks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CrossChainMonitor transactions={transactions || []} />
              </CardContent>
            </Card>
          </div>
        )}

        <footer className="mt-20 py-8 text-center text-muted-foreground text-sm border-t border-border">
          <p>
            &copy; {new Date().getFullYear()} Carbon Offset Platform. All rights
            reserved.
          </p>
          <p className="mt-1">
            Empowering a sustainable future, one block at a time.
          </p>
        </footer>
      </div>
    </main>
  );
}
