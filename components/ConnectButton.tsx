"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, User } from "lucide-react";

export default function ConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <Button variant="glass" size="lg" disabled>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        Loading...
      </Button>
    );
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={logout}
          className="border-white/20 hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="gradient" 
      size="xl" 
      onClick={login}
      className="shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
    >
      <Wallet className="w-5 h-5" />
      Connect Wallet
    </Button>
  );
}
