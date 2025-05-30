import { Transaction } from "../types/transaction";

export async function fetchTransactionHistory(
  walletAddress: string
): Promise<Transaction[]> {
  try {
    const response = await fetch(
      `https://flare-explorer.flare.network/api?module=account&action=txlist&address=${walletAddress}&sort=desc&page=1&offset=100`
    );

    const data = await response.json();

    if (data.status === "1" && Array.isArray(data.result)) {
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        timestamp: tx.timeStamp,
        gasUsed: tx.gasUsed,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return [];
  }
}
