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
  
  const interval = getAggregationInterval(); // For now, we'll stick to daily aggregation for simplicity

  const processedData = filteredTransactions.reduce<ProcessedData[]>((acc, tx) => {
    const txDate = tx.date;
    // For simplicity, we'll group by day. More complex grouping (hourly, weekly, monthly) can be added.
    const dateKey = format(txDate, "yyyy-MM-dd");
    
    let entry = acc.find(e => e.date === dateKey);
    const gas = parseInt(tx.gasUsed);

    if (entry) {
      entry.gasUsed += gas;
      entry.transactionCount += 1;
    } else {
      acc.push({
        date: dateKey,
        gasUsed: gas,
        cumulativeGasUsed: 0, // Will be calculated later
        transactionCount: 1,
      });
    }
    return acc;
  }, []);

  let cumulativeGas = 0;
  processedData.forEach(entry => {
    cumulativeGas += entry.gasUsed;
    entry.cumulativeGasUsed = cumulativeGas;
  });

  console.log(`[GasUsageGraph] Number of processed data points for chart: ${processedData.length}`);
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
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(dateStr) => format(parseISO(dateStr), "MMM d")}
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#8884d8"
            tickFormatter={formatYAxisGas}
            label={{ value: "Gas Used", angle: -90, position: "insideLeft", fill: "#8884d8", dy: 40, dx: -5, fontSize: 14 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#82ca9d"
            tickFormatter={formatYAxisGas}
            label={{ value: "Cumulative Gas", angle: 90, position: "insideRight", fill: "#82ca9d", dy: -70, dx: 5, fontSize: 14 }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.8)", borderColor: "#4b5563", borderRadius: "0.5rem" }}
            labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
            itemStyle={{ color: "#d1d5db" }}
            formatter={(value: number, name: string) => {
              const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
              if (name === "gasUsed") return [formattedValue, "Gas Used"];
              if (name === "cumulativeGasUsed") return [formattedValue, "Cumulative Gas"];
              if (name === "transactionCount") return [formattedValue, "Transactions"];
              return [formattedValue, name];
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Bar yAxisId="left" dataKey="gasUsed" name="Gas Used / Period" fill="#8884d8" barSize={20} />
          <Line yAxisId="right" type="monotone" dataKey="cumulativeGasUsed" name="Cumulative Gas Used" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GasUsageGraph;
