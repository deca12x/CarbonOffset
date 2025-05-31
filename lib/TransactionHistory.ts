import { Transaction } from "../types/transaction";

export async function fetchTransactionHistory(
  walletAddress: string
): Promise<Transaction[]> {
  try {
    // Call your local API endpoint
    const response = await fetch(
      `/api/transactions?address=${walletAddress}`
    );

    if (!response.ok) {
      // Handle non-OK responses from your local API
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      console.error(`Error fetching transaction history from local API: ${response.status}`, errorData);
      // You might want to throw an error here or return an empty array based on how react-query handles it
      throw new Error(errorData.error || `Failed to fetch transaction history: ${response.status}`);
    }

    const data: Transaction[] = await response.json();
    return data; // The local API now returns the already mapped transactions

  } catch (error) {
    console.error("Error in fetchTransactionHistory calling local API:", error);
    // Ensure react-query can catch this error
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while fetching transaction history.");
  }
}
