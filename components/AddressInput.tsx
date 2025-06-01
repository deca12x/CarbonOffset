"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit3, Check, X, Copy, ExternalLink } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  label?: string;
  placeholder?: string;
}

export default function AddressInput({ 
  value, 
  onChange, 
  label = "Destination Address",
  placeholder = "Enter Polygon address (0x...)"
}: AddressInputProps) {
  const { user } = usePrivy();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  // Set default to user's address when they log in
  useEffect(() => {
    if (user?.wallet?.address && !value) {
      onChange(user.wallet.address);
    }
  }, [user?.wallet?.address, value, onChange]);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const validateAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSave = () => {
    if (validateAddress(tempValue)) {
      onChange(tempValue);
      setIsEditing(false);
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
    setIsValid(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  const openInExplorer = () => {
    if (value) {
      window.open(`https://polygon.blockscout.com/address/${value}`, '_blank');
    }
  };

  return (
    <Card className="glass-strong">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {label}
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0 hover:bg-white/10"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                value={tempValue}
                onChange={(e) => {
                  setTempValue(e.target.value);
                  setIsValid(true);
                }}
                placeholder={placeholder}
                className={`font-mono text-sm ${
                  !isValid ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
              />
              {!isValid && (
                <p className="text-destructive text-xs">
                  Please enter a valid Ethereum address (0x followed by 40 hex characters)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={!tempValue.trim()}
              >
                <Check className="w-3 h-3" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-white/20 hover:bg-white/10"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="glass rounded-lg p-3 font-mono text-sm break-all">
              {value || "No address set"}
            </div>
            {value && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="border-white/20 hover:bg-white/10"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInExplorer}
                  className="border-white/20 hover:bg-white/10"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Polygonscan
                </Button>
              </div>
            )}
            {user?.wallet?.address && value !== user.wallet.address && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(user.wallet.address)}
                className="text-muted-foreground hover:text-foreground"
              >
                Use my address ({user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 