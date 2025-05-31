Summary - Cross-chain Carbon Offsets


How it works
Get history of txs of wallet x on chain y (e.g. Flow)
Calculate carbon footprint (offchain) - e.g. $100
Offset emissions in one click
100 USDC from wallet x, bridge to Polygon (using Layerzero), buy carbon credits.

User flow
User searches for an EOA address
Sees dashboard of carbon emissions from tx history (e.g. on Flow) AND carbon credits on Polygon
They can proceed to offset that amount, even if it’s not the same wallet.

We calculate the carbon footprint with a formula that works for any EVM chain, based on the cost of gas at a given time and the blocksize of each transaction.

After having the exact amount of carbon credits that would be necessary to buy for your wallet to be considered ,,green” ; you can decide to pay for that using your flow funds.

As there’s currently no way of buying carbon credits in funds, and the carbon credits market is full of scamish sellers, you need to make the purchase in polygon, and we provide you with a full cross-chain workflow, which will bridge the necessary funds to polygon and then make the transaction atomically.
