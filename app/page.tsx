// app/page.tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Loader2, TrendingUp, Leaf, Globe, ArrowRight, History, Coins, UserCircle, BarChart3, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactionHistory } from "@/lib/TransactionHistory";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";
import AddressInput from "@/components/AddressInput";
import { useRef, useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CrossChainMonitor } from "@/components/CrossChainMonitor";
import { formatUnits } from "viem";
import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
const walletWithNctOnPolygon = "0x6998FE700015f04FB192f46Ec1DcB59320334f4B"; // Example wallet, replace or fetch dynamically

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
    refetch: refetchTransactions 
  } = useQuery({
    queryKey: ["transactions", walletToSearch],
    queryFn: () => walletToSearch ? fetchTransactionHistory(walletToSearch) : Promise.resolve([]),
    enabled: !!walletToSearch,
  });

  const [nctBalance, setNctBalance] = useState<string>("0");
  const [nctLoading, setNctLoading] = useState(true);
  const [nctError, setNctError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchNCTBalance = async () => {
      if (!user?.wallet?.address) {
        // Don't fetch if user is not logged in or wallet address is not available.
        // Or use walletWithNctOnPolygon for general display if desired
        setNctLoading(false);
        setNctBalance("0"); 
        return;
      }
      try {
        setNctLoading(true);
        const balance = await publicClient.readContract({
          address: NCT_CONTRACT_ADDRESS as `0x${string}`,
          abi: erc20ABI,
          functionName: "balanceOf",
          args: [user.wallet.address as `0x${string}`], // Use logged-in user's address
        });
        setNctBalance(balance.toString());
        setNctError(null);
      } catch (error) {
        console.error("Error fetching NCT balance:", error);
        setNctError(error as Error);
      } finally {
        setNctLoading(false);
      }
    };

    if(authenticated && user?.wallet?.address){
      fetchNCTBalance();
    }
  }, [authenticated, user?.wallet?.address]);

  useEffect(() => {
    if (authenticated) {
      document.body.classList.add("is-authenticated");
      if (user?.wallet?.address && !destinationAddress) {
        setDestinationAddress(user.wallet.address);
      }
      if (user?.wallet?.address && !searchAddress) {
        setSearchAddress(user.wallet.address);
        setTempSearchAddress(user.wallet.address);
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
            Your decentralized platform for transparent carbon credit trading and real-world environmental impact tracking.
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
                  Connect your wallet to access powerful tools for carbon offsetting and contribute to a greener future.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  {[ { icon: Leaf, text: "Trade Carbon Credits" }, { icon: Globe, text: "Cross-Chain Bridge" }, { icon: BarChart3, text: "Track Your Impact" } ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center p-4 glass rounded-lg">
                      <item.icon className="w-10 h-10 text-primary mb-3" />
                      <span className="text-sm font-medium text-foreground">{item.text}</span>
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
                  <p className="text-sm text-muted-foreground mb-1">Connected as:</p>
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
                  <CardDescription>Nature Carbon Tonne on Polygon</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  {nctLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  ) : nctError ? (
                    <p className="text-destructive text-sm">Error: {nctError.message}</p>
                  ) : (
                    <p className="text-4xl font-bold gradient-text">
                      {(parseFloat(nctBalance) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 })} NCT
                    </p>
                  )}
                </CardContent>
                {!nctLoading && !nctError && (
                  <CardFooter>
                    <Button variant="outline" size="sm" asChild className="w-full glass hover:border-primary">
                      <a href={`https://polygonscan.com/address/${NCT_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">
                        View on Polygonscan <ArrowRight className="ml-2" />
                      </a>
                    </Button>
                  </CardFooter>
                )}
              </Card>
              
              <div className="md:col-span-2 lg:col-span-1">
                 <AddressInput value={destinationAddress} onChange={setDestinationAddress} label="Bridge Destination Address" />
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
                  Displaying transactions for: <span className="font-mono text-primary">{walletToSearch ? `${walletToSearch.slice(0, 10)}...${walletToSearch.slice(-8)}` : 'your connected wallet'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Input
                    type="search"
                    placeholder="Enter wallet address to view its history (0x...)"
                    value={tempSearchAddress}
                    onChange={(e) => setTempSearchAddress(e.target.value)}
                    className="font-mono text-sm flex-grow glass-strong placeholder:text-muted-foreground"
                  />
                  <Button type="submit" variant="gradient" className="w-full sm:w-auto">
                    <Search className="mr-2" /> Search
                  </Button>
                  {searchAddress !== user?.wallet?.address && user?.wallet?.address && (
                     <Button type="button" variant="outline" className="w-full sm:w-auto glass hover:border-primary" onClick={() => {setTempSearchAddress(user.wallet?.address || ""); setSearchAddress(user.wallet?.address || "");}}>
                       View My History
                     </Button>
                  )}
                </form>
                {txLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : txError ? (
                  <p className="text-destructive text-center py-6">Error loading transactions. Please try again.</p>
                ) : transactions && transactions.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="p-3 text-left font-semibold text-muted-foreground">Hash</th>
                          <th className="p-3 text-left font-semibold text-muted-foreground">Date</th>
                          <th className="p-3 text-right font-semibold text-muted-foreground">Gas Used</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {transactions.map((tx) => (
                          <tr key={tx.hash} className="hover:bg-white/5 transition-colors duration-150">
                            <td className="p-3 font-mono">
                              <a href={`https://flare-explorer.flare.network/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary underline-offset-4 hover:underline">
                                {tx.hash.slice(0, 12)}...{tx.hash.slice(-10)}
                              </a>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {formatDistanceToNow(new Date(parseInt(tx.timestamp) * 1000), { addSuffix: true })}
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground">{tx.gasUsed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-10">No transactions found for this address.</p>
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
                <CardDescription>Track your bridge transactions across multiple blockchain networks.</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossChainMonitor />
              </CardContent>
            </Card>
          </div>
        )}

        <footer className="mt-20 py-8 text-center text-muted-foreground text-sm border-t border-border">
          <p>&copy; {new Date().getFullYear()} Carbon Offset Platform. All rights reserved.</p>
          <p className="mt-1">Empowering a sustainable future, one block at a time.</p>
        </footer>
      </div>
    </main>
  );
}
