"use client";

import { Transaction } from "@/types/transaction";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
  error: any;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-white/10 backdrop-blur-md rounded-lg shadow-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-6 bg-red-900/30 backdrop-blur-md rounded-lg shadow-xl">
        Error loading transactions. Please try again later.
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-xl">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-1">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Transaction Hash
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Gas Used
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900/50 divide-y divide-gray-700">
          {transactions?.map((tx) => (
            <tr key={tx.hash} className="hover:bg-gray-800/60 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400 hover:text-blue-300">
                <a
                  href={`https://flare-explorer.flare.network/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tx.hash}
                >
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {formatDistanceToNow(
                  new Date(parseInt(tx.timestamp) * 1000),
                  {
                    addSuffix: true,
                  }
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {parseInt(tx.gasUsed).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
