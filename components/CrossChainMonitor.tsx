"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useReadContract, useWriteContract } from "wagmi";
import { useTransactionPopup } from "@blockscout/app-sdk";
import { parseEther, parseUnits, formatUnits, Hex, erc20Abi, decodeEventLog } from "viem";
import { LayerZeroTracker } from "./LayerZeroTracker";

const FLARE_CHAIN_ID_NUM = 14;
const FLARE_CHAIN_ID_STR = "14";

// From CarbonHardhat/scripts/config/constants.ts
const CARBON_OFFSET_FLARE_CONTRACT_ADDRESS: Hex = "0xceca34b92dbbaf1715de564172c61a4782248ccd";
// This is the standard ERC20 USDT on Flare (same as used in deployAndBridge.ts)
const FLARE_USDT_TOKEN_ADDRESS: Hex = "0x0B38e83B86d491735fEaa0a791F65c2B99535396";

const carbonOffsetFlareAbi = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "usdtAmountToBridge", "type": "uint256" },
      { "internalType": "address", "name": "flareInitiator", "type": "address" },
      { "internalType": "address", "name": "finalEoaRecipientOnPolygon", "type": "address" },
      { "internalType": "uint256", "name": "minOutputOrOtherParam", "type": "uint256" },
      { "internalType": "uint256", "name": "composeGasLimit", "type": "uint256" }
    ],
    "name": "getFeeForBridgeAndExecute",
    "outputs": [
      { "internalType": "uint256", "name": "nativeFee", "type": "uint256" },
      { "internalType": "uint256", "name": "lzTokenFee", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "usdtAmountToBridge", "type": "uint256" },
      { "internalType": "address", "name": "finalEoaRecipientOnPolygon", "type": "address" },
      { "internalType": "uint256", "name": "minOutputOrOtherParam", "type": "uint256" },
      { "internalType": "uint256", "name": "composeGasLimit", "type": "uint256" }
    ],
    "name": "bridgeAndExecuteOnPolygon",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// LayerZero OFT events for message tracking
const layerZeroOftAbi = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "guid", "type": "bytes32" },
      { "indexed": false, "internalType": "uint32", "name": "srcEid", "type": "uint32" },
      { "indexed": true, "internalType": "address", "name": "toAddress", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amountReceivedLD", "type": "uint256" }
    ],
    "name": "OFTReceived",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "guid", "type": "bytes32" },
      { "indexed": false, "internalType": "uint32", "name": "dstEid", "type": "uint32" },
      { "indexed": true, "internalType": "address", "name": "fromAddress", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amountSentLD", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amountReceivedLD", "type": "uint256" }
    ],
    "name": "OFTSent",
    "type": "event"
  }
] as const;

const USDT_DECIMALS = 6;

// Simple custom toast notification component
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-md`}>
      <div className="flex justify-between items-center">
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">×</button>
      </div>
    </div>
  );
};

export const CrossChainMonitor: React.FC = () => {
  const { address } = useAccount();
  const { openPopup } = useTransactionPopup();

  const [amount, setAmount] = useState("1"); // Amount of USDT to bridge
  const [recipient, setRecipient] = useState(""); // Polygon recipient address
  const [estimatedLzNativeFee, setEstimatedLzNativeFee] = useState<bigint | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentStage, setCurrentStage] = useState<'idle' | 'estimating' | 'transferring' | 'bridging'>('idle');
  const [layerZeroGuid, setLayerZeroGuid] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Check user's USDT balance
  const { data: userUsdtBalance, refetch: refetchUsdtBalance } = useReadContract({
    address: FLARE_USDT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    chainId: FLARE_CHAIN_ID_NUM,
    query: {
      enabled: !!address,
    }
  });

  // --- Stage 1: Transfer USDT to CarbonOffsetFlare contract ---
  const { data: transferHash, writeContractAsync: transferUsdt, isPending: isTransferring, error: transferError } = useWriteContract();
  const { isLoading: isConfirmingTransfer, isSuccess: isTransferConfirmed, error: transferReceiptError } = 
    useWaitForTransactionReceipt({ hash: transferHash, chainId: FLARE_CHAIN_ID_NUM });

  // --- Stage 2: Call bridgeAndExecuteOnPolygon --- (Depends on successful transfer)
  const { data: bridgeHash, writeContractAsync: bridgeAndExecute, isPending: isBridging, error: bridgeError } = useWriteContract();
  const { isLoading: isConfirmingBridge, isSuccess: isBridgeConfirmed, error: bridgeReceiptError, data: bridgeReceiptData } = 
    useWaitForTransactionReceipt({ hash: bridgeHash, chainId: FLARE_CHAIN_ID_NUM });

  // Fee estimation
  const { data: feeData, error: feeError, refetch: estimateFees, isLoading: isEstimatingFee } = useReadContract({
    address: CARBON_OFFSET_FLARE_CONTRACT_ADDRESS,
    abi: carbonOffsetFlareAbi,
    functionName: 'getFeeForBridgeAndExecute',
    args: [
      parseUnits(amount || "0", USDT_DECIMALS),
      address!,
      recipient as Hex,
      0n, // minOutputOrOtherParam (TODO: integrate 1inch if needed)
      200000n // composeGasLimit
    ],
    chainId: FLARE_CHAIN_ID_NUM,
    query: {
      enabled: false, // Only call when estimateFees is triggered
    }
  });

  // Custom toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (feeData) {
      setEstimatedLzNativeFee(feeData[0]);
      setStatusMessage(`Estimated LZ Fee: ${formatUnits(feeData[0], 18)} FLR`);
    }
    if (feeError) setStatusMessage(`Fee estimation error: ${feeError.message.split('\n')[0]}`);
  }, [feeData, feeError]);

  // Update status message when USDT balance is loaded
  useEffect(() => {
    if (userUsdtBalance !== undefined && address) {
      const balanceFormatted = formatUnits(userUsdtBalance, USDT_DECIMALS);
      setStatusMessage(`Your USDT balance: ${balanceFormatted} USDT`);
    }
  }, [userUsdtBalance, address]);

  // Extract LayerZero GUID from transaction logs
  const extractLayerZeroGuid = (logs: any[]) => {
    try {
      for (const log of logs) {
        try {
          // Try to decode as OFTSent event
          const decoded = decodeEventLog({
            abi: layerZeroOftAbi,
            data: log.data,
            topics: log.topics,
          });
          
          if (decoded.eventName === 'OFTSent' && decoded.args.guid) {
            return decoded.args.guid as string;
          }
        } catch (e) {
          // Continue to next log if this one doesn't match
          continue;
        }
      }
    } catch (e) {
      console.log("Could not extract LayerZero GUID:", e);
    }
    return null;
  };

  const handleFullBridgeProcess = async () => {
    if (!address || !recipient || parseFloat(amount) <= 0) {
      alert("Please connect wallet, enter a valid recipient, and amount.");
      return;
    }

    const usdtAmountBigInt = parseUnits(amount, USDT_DECIMALS);
    
    // Check if user has enough USDT
    if (!userUsdtBalance || userUsdtBalance < usdtAmountBigInt) {
      const requiredAmount = formatUnits(usdtAmountBigInt, USDT_DECIMALS);
      const currentBalance = userUsdtBalance ? formatUnits(userUsdtBalance, USDT_DECIMALS) : "0";
      setStatusMessage(`Insufficient USDT balance. Need: ${requiredAmount} USDT, Have: ${currentBalance} USDT`);
      return;
    }

    setStatusMessage("Estimating LayerZero fees...");
    setCurrentStage('estimating');
    
    const feeResult = await estimateFees();
    if (!feeResult || !feeResult.data || feeResult.error) {
      setStatusMessage(`Failed to estimate LZ fees: ${feeResult.error?.message.split('\n')[0] || 'Unknown error'}`);
      setCurrentStage('idle');
      return;
    }
    
    const nativeFee = feeResult.data[0];
    setEstimatedLzNativeFee(nativeFee);
    setStatusMessage(`Estimated LZ Fee: ${formatUnits(nativeFee, 18)} FLR. Proceeding to USDT transfer.`);
    
    // Step 1: Transfer USDT to CarbonOffsetFlare contract
    setCurrentStage('transferring');
    setStatusMessage("Transferring USDT to bridge contract...");
    try {
      await transferUsdt({
        address: FLARE_USDT_TOKEN_ADDRESS, // The ERC20 USDT token
        abi: erc20Abi,
        functionName: 'transfer',
        args: [CARBON_OFFSET_FLARE_CONTRACT_ADDRESS, usdtAmountBigInt],
        chainId: FLARE_CHAIN_ID_NUM,
      });
    } catch (e: any) {
      setStatusMessage(`USDT Transfer failed: ${e.message.split('\n')[0]}`);
      setCurrentStage('idle');
    }
  };

  // Effect for transfer transaction toast
  useEffect(() => {
    if (transferHash) {
      showToast(`USDT transfer initiated: ${transferHash.slice(0, 10)}...`, 'info');
      setStatusMessage(`USDT transfer initiated: ${transferHash}. Waiting for confirmation...`);
    }
  }, [transferHash]);

  // Effect for when USDT transfer is confirmed, then trigger bridge
  useEffect(() => {
    if (isTransferConfirmed && estimatedLzNativeFee !== null) {
      setStatusMessage("USDT transfer confirmed! Proceeding to bridge...");
      setCurrentStage('bridging');
      showToast("USDT transfer confirmed! Starting bridge...", 'success');
      bridgeAndExecute({
        address: CARBON_OFFSET_FLARE_CONTRACT_ADDRESS,
        abi: carbonOffsetFlareAbi,
        functionName: 'bridgeAndExecuteOnPolygon',
        args: [
          parseUnits(amount, USDT_DECIMALS),
          recipient as Hex,
          0n, // minOutputOrOtherParam
          200000n // composeGasLimit
        ],
        value: estimatedLzNativeFee, 
        chainId: FLARE_CHAIN_ID_NUM,
      }).catch(e => {
         setStatusMessage(`Bridge initiation failed: ${e.message.split('\n')[0]}`);
         setCurrentStage('idle');
         showToast(`Bridge failed: ${e.message.split('\n')[0]}`, 'error');
      });
    } else if (transferReceiptError) {
      setStatusMessage(`USDT Transfer confirmation error: ${transferReceiptError.message.split('\n')[0]}`);
      setCurrentStage('idle');
      showToast(`Transfer failed: ${transferReceiptError.message.split('\n')[0]}`, 'error');
    }
  }, [isTransferConfirmed, transferReceiptError, bridgeAndExecute, amount, recipient, estimatedLzNativeFee]);

  // Effect for bridge transaction toast and LayerZero GUID extraction
  useEffect(() => {
    if (bridgeHash) {
      showToast(`Bridge transaction initiated: ${bridgeHash.slice(0, 10)}...`, 'info');
      setStatusMessage(`Bridge transaction initiated: ${bridgeHash}. Waiting for confirmation...`);
    }
    if (isBridgeConfirmed && bridgeHash && bridgeReceiptData) {
      // Extract LayerZero GUID from logs
      const guid = extractLayerZeroGuid(bridgeReceiptData.logs);
      if (guid) {
        setLayerZeroGuid(guid);
        setStatusMessage(`Bridge confirmed! LayerZero GUID: ${guid}`);
        showToast(`Bridge successful! Starting cross-chain tracking...`, 'success');
      } else {
        setStatusMessage(`Bridge confirmed: ${bridgeHash}! Check LayerZeroScan.`);
        showToast(`Bridge confirmed! Check transaction for LayerZero details.`, 'success');
      }
      setCurrentStage('idle');
      // Refresh USDT balance after successful bridge
      refetchUsdtBalance();
    } else if (bridgeReceiptError) {
        setStatusMessage(`Bridge confirmation error: ${bridgeReceiptError.message.split('\n')[0]}`);
        setCurrentStage('idle');
        showToast(`Bridge confirmation failed: ${bridgeReceiptError.message.split('\n')[0]}`, 'error');
    }
  }, [bridgeHash, isBridgeConfirmed, bridgeReceiptData, bridgeReceiptError, refetchUsdtBalance]);

  const isLoading = isEstimatingFee || isTransferring || isConfirmingTransfer || isBridging || isConfirmingBridge;
  const usdtAmountBigInt = parseUnits(amount || "0", USDT_DECIMALS);
  const hasInsufficientBalance = userUsdtBalance !== undefined && userUsdtBalance < usdtAmountBigInt;

  return (
    <div className="space-y-8">
      {/* Custom Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Bridge Interface */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Cross-Chain Bridge (Flare to Polygon)</h3>
        
        {/* Balance Display */}
        {userUsdtBalance !== undefined && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            <p className="text-sm text-gray-300">
              Your USDT Balance: <span className="text-white font-mono">{formatUnits(userUsdtBalance, USDT_DECIMALS)} USDT</span>
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Amount USDT to Bridge</label>
            <input 
              type="number" 
              id="amount" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className={`mt-1 block w-full bg-white/5 border-gray-600 text-white rounded-md shadow-sm p-2 ${hasInsufficientBalance ? 'border-red-500' : ''}`}
              placeholder="e.g., 10"
            />
            {hasInsufficientBalance && (
              <p className="mt-1 text-sm text-red-400">Insufficient USDT balance</p>
            )}
          </div>
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">Recipient Address (Polygon)</label>
            <input 
              type="text" 
              id="recipient" 
              value={recipient} 
              onChange={(e) => setRecipient(e.target.value)} 
              className="mt-1 block w-full bg-white/5 border-gray-600 text-white rounded-md shadow-sm p-2" 
              placeholder="0x..."
            />
          </div>
          <button 
            onClick={handleFullBridgeProcess} 
            disabled={isLoading || !address || hasInsufficientBalance} 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
          >
            {isLoading ? `Processing: ${currentStage}...` : "Initiate Bridge Process"}
          </button>
        </div>
        
        {statusMessage && <div className="mt-4 text-sm text-gray-300 break-all">Status: {statusMessage}</div>}
        
        {(transferError || bridgeError) && (
          <div className="mt-4 text-red-400">
            {transferError && `USDT Transfer Error: ${transferError.message.split('\n')[0]}`}
            {bridgeError && `Bridge Error: ${bridgeError.message.split('\n')[0]}`}
          </div>
        )}
        
        {/* Basic Transaction Links */}
        {bridgeHash && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-2">Bridge Transaction (Flare):</h4>
            <a href={`https://flare-explorer.flare.network/tx/${bridgeHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-mono break-all">{bridgeHash}</a>
          </div>
        )}
        
        <div className="mt-6">
          <button 
            onClick={() => openPopup({ chainId: FLARE_CHAIN_ID_STR, address })} 
            disabled={!address} 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500"
          >
            Show My Transaction History (Flare)
          </button>
        </div>
      </div>

      {/* LayerZero Tracker - Only show when we have a GUID */}
      {layerZeroGuid && (
        <LayerZeroTracker 
          guid={layerZeroGuid} 
          autoStart={true}
        />
      )}
    </div>
  );
}; 