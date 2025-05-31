"use client";

import { useState, useEffect, useMemo } from "react";
import { Transaction } from "@/types/transaction";
import GasUsageGraph from "./GasUsageGraph";
import TransactionTable from "./TransactionTable";
import { Loader2 } from "lucide-react";
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from "date-fns";

interface TransactionViewTabsProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
  error: any;
}

type Preset = "all" | "1d" | "1w" | "1m" | "1y";

const TransactionViewTabs: React.FC<TransactionViewTabsProps> = ({
  transactions,
  isLoading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<"graph" | "table">("graph");
  const [selectedPreset, setSelectedPreset] = useState<Preset>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const allTransactionsSorted = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
  }, [transactions]);

  useEffect(() => {
    if (allTransactionsSorted.length > 0) {
      const firstTxDate = new Date(parseInt(allTransactionsSorted[0].timestamp) * 1000);
      const lastTxDate = new Date(parseInt(allTransactionsSorted[allTransactionsSorted.length - 1].timestamp) * 1000);

      switch (selectedPreset) {
        case "1d":
          setStartDate(startOfDay(subDays(new Date(), 0))); // Today
          setEndDate(endOfDay(new Date()));
          break;
        case "1w":
          setStartDate(startOfDay(subWeeks(new Date(), 1)));
          setEndDate(endOfDay(new Date()));
          break;
        case "1m":
          setStartDate(startOfDay(subMonths(new Date(), 1)));
          setEndDate(endOfDay(new Date()));
          break;
        case "1y":
          setStartDate(startOfDay(subYears(new Date(), 1)));
          setEndDate(endOfDay(new Date()));
          break;
        case "all":
        default:
          setStartDate(startOfDay(firstTxDate));
          setEndDate(endOfDay(lastTxDate));
          break;
      }
    } else if (selectedPreset !== "all") {
        // Handle presets if no transactions yet, default to today for relevant presets
        const now = new Date();
        switch (selectedPreset) {
            case "1d": setStartDate(startOfDay(now)); setEndDate(endOfDay(now)); break;
            case "1w": setStartDate(startOfDay(subWeeks(now, 1))); setEndDate(endOfDay(now)); break;
            case "1m": setStartDate(startOfDay(subMonths(now, 1))); setEndDate(endOfDay(now)); break;
            case "1y": setStartDate(startOfDay(subYears(now, 1))); setEndDate(endOfDay(now)); break;
            default: setStartDate(null); setEndDate(null); break;
        }
    } else {
        setStartDate(null);
        setEndDate(null);
    }
  }, [selectedPreset, allTransactionsSorted]);

  const handlePresetChange = (preset: Preset) => {
    setSelectedPreset(preset);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset("custom" as any); // Indicate custom range
    setStartDate(e.target.value ? new Date(e.target.value) : null);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset("custom" as any); // Indicate custom range
    setEndDate(e.target.value ? new Date(e.target.value) : null);
  };
  
  const presetButtons: { label: string; value: Preset }[] = [
    { label: "1 Day", value: "1d" },
    { label: "1 Week", value: "1w" },
    { label: "1 Month", value: "1m" },
    { label: "1 Year", value: "1y" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 border-b-2 border-gray-700 pb-px">
        <button
          onClick={() => setActiveTab("graph")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-150
            ${activeTab === "graph" ? "bg-primary text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"}`}
        >
          Gas Usage Graph
        </button>
        <button
          onClick={() => setActiveTab("table")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-150
            ${activeTab === "table" ? "bg-primary text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"}`}
        >
          Transaction List
        </button>
      </div>

      {/* Date Filters */}
      <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg shadow-lg space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4">
        <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presetButtons.map(preset => (
            <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`px-3 py-2 text-xs sm:text-sm rounded-md transition-all duration-150
                ${selectedPreset === preset.value ? "bg-primary text-white shadow-md" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
            >
                {preset.label}
            </button>
            ))}
        </div>
        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 md:pt-0">
            <div>
                <label htmlFor="startDate" className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                <input
                type="date"
                id="startDate"
                value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 text-sm bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-primary focus:border-primary shadow-sm"
                />
            </div>
            <div>
                <label htmlFor="endDate" className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                <input
                type="date"
                id="endDate"
                value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 text-sm bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-primary focus:border-primary shadow-sm"
                />
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-4">
        {isLoading && activeTab === "graph" && (
           <div className="flex justify-center items-center p-8 h-[400px] sm:h-[500px] bg-white/10 backdrop-blur-md rounded-lg shadow-xl">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
           </div>
        )}
        {!isLoading && activeTab === "graph" && transactions && (
          <GasUsageGraph transactions={transactions} startDate={startDate} endDate={endDate} />
        )}
        {activeTab === "table" && (
          <TransactionTable transactions={transactions} isLoading={isLoading} error={error} />
        )}
      </div>
    </div>
  );
};

export default TransactionViewTabs;
