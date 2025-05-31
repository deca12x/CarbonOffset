"use client";

import { Transaction } from "@/types/transaction";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO, startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears } from "date-fns";

interface GasUsageGraphProps {
  transactions: Transaction[];
  startDate: Date | null;
  endDate: Date | null;
}

interface ProcessedData {
  date: string;
  gasUsed: number;
  cumulativeGasUsed: number;
  transactionCount: number;
}

const GasUsageGraph: React.FC<GasUsageGraphProps> = ({
  transactions,
  startDate,
  endDate,
}) => {
  console.log("[GasUsageGraph] Props received:", { numTransactions: transactions?.length, startDate, endDate });

  const filteredTransactions = transactions
    .map(tx => ({ ...tx, date: new Date(parseInt(tx.timestamp) * 1000) }))
    .filter(tx => {
      if (!startDate || !endDate) return true; // Show all if no date range
      const txDate = tx.date;
      return txDate >= startOfDay(startDate) && txDate <= endOfDay(endDate);
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log(`[GasUsageGraph] Number of filtered transactions: ${filteredTransactions.length}`);

  if (filteredTransactions.length === 0) {
    console.log("[GasUsageGraph] Rendering: 'No transaction data available for the selected period.'");
    return <div className="text-center p-6 text-gray-300 bg-white/10 backdrop-blur-md rounded-lg shadow-xl">No transaction data available for the selected period.</div>;
  }

  // Determine aggregation interval based on the date range
  const getAggregationInterval = () => {
    if (!startDate || !endDate) return 'daily'; // Default for "all" or uninitialized
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    if (diffDays <= 7) return 'hourly'; // Not implemented yet, fallback to daily
    if (diffDays <= 90) return 'daily'; // Up to ~3 months
    if (diffDays <= 365 * 2) return 'weekly'; // Up to 2 years
    return 'monthly'; // More than 2 years
  };
  
  const interval = getAggregationInterval();
  console.log("[GasUsageGraph] Aggregation interval:", interval);

  const processedData = filteredTransactions.reduce<ProcessedData[]>((acc, tx) => {
    const txDate = tx.date;
    let dateKey: string;

    switch (interval) {
      case 'hourly':
        dateKey = format(txDate, "yyyy-MM-dd HH:00"); // Group by hour
        break;
      // Add 'weekly' and 'monthly' cases here if needed in the future
      // For 'weekly', you might use format(startOfWeek(txDate), "yyyy-MM-dd")
      // For 'monthly', you might use format(startOfMonth(txDate), "yyyy-MM")
      case 'daily':
      default:
        dateKey = format(txDate, "yyyy-MM-dd"); // Group by day
        break;
    }
    
    let entry = acc.find(e => e.date === dateKey);
    const gas = parseInt(tx.gasUsed);

    if (isNaN(gas)) {
      console.warn(`[GasUsageGraph] Parsed gas is NaN for transaction:`, tx);
      // If gas is NaN, we should probably not add it or treat it as 0.
      // For now, we'll let it proceed to see how Recharts handles it, but this is a flag.
    }

    if (entry) {
      entry.gasUsed += isNaN(gas) ? 0 : gas; // Add 0 if gas is NaN
      entry.transactionCount += 1;
    } else {
      acc.push({
        date: dateKey,
        gasUsed: isNaN(gas) ? 0 : gas, // Use 0 if gas is NaN
        cumulativeGasUsed: 0, // Will be calculated later
        transactionCount: 1,
      });
    }
    return acc;
  }, []);

  // Sort data by date key to ensure cumulative sum is correct, especially for hourly/daily strings
  processedData.sort((a, b) => a.date.localeCompare(b.date));

  let cumulativeGas = 0;
  processedData.forEach(entry => {
    cumulativeGas += entry.gasUsed;
    entry.cumulativeGasUsed = cumulativeGas;
  });

  console.log(`[GasUsageGraph] Number of processed data points for chart after ${interval} aggregation: ${processedData.length}`);
  if (processedData.length > 0) {
    console.log("[GasUsageGraph] First processed data point:", processedData[0]);
  }
  
  const formatYAxisGas = (tickItem: number) => {
    if (tickItem >= 1_000_000_000) return `${(tickItem / 1_000_000_000).toFixed(1)}B`;
    if (tickItem >= 1_000_000) return `${(tickItem / 1_000_000).toFixed(1)}M`;
    if (tickItem >= 1_000) return `${(tickItem / 1_000).toFixed(1)}K`;
    return tickItem.toString();
  };

  console.log("[GasUsageGraph] Attempting to render ComposedChart.");
  return (
    <div className="p-4 sm:p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-xl h-[400px] sm:h-[500px]">
      <p className="text-white">Test: GasUsageGraph component is rendering.</p>
      <p className="text-white">If you see this, the parsing issue is likely within the more complex chart structure that was previously here, or the debug info display.</p>
    </div>
  );
};

export default GasUsageGraph;
