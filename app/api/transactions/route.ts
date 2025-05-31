import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('address');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    // Construct the Flare Explorer API URL
    // Ensure you use the correct base URL and parameters as in your original fetchTransactionHistory
    const apiUrl = `https://flare-explorer.flare.network/api?module=account&action=txlist&address=${walletAddress}&sort=desc&page=1&offset=100`;
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      // Forward the error status from the external API if possible
      const errorText = await response.text();
      console.error(`Error fetching from Flare Explorer API: ${response.status} ${errorText}`);
      return NextResponse.json({ error: `Failed to fetch data from Flare Explorer: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();

    // Assuming the structure of data.result is what you need
    if (data.status === "1" && Array.isArray(data.result)) {
      const transactions = data.result.map((tx: any) => ({
        hash: tx.hash,
        timestamp: tx.timeStamp, // Ensure this matches the original mapping
        gasUsed: tx.gasUsed,
      }));
      return NextResponse.json(transactions);
    } else if (data.status === "0" && data.message === "No transactions found") {
      return NextResponse.json([]); // Return empty array for no transactions
    } else {
      // Handle other non-successful statuses or unexpected data structure
      console.warn("Unexpected response structure from Flare Explorer:", data);
      return NextResponse.json({ error: "Unexpected response from Flare Explorer", details: data.message || data.result }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in transaction proxy API route:", error);
    return NextResponse.json({ error: 'Internal server error while fetching transaction history' }, { status: 500 });
  }
}
