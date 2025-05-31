1. User logs in

Display input bar

2. User inputs a wallet address

Display dashboard with:
- Flare tx history & gas spent
- Celo ownership of CHAR
AND display Offset button
Meanwhile in the backend:
- Use new Blockscout gas
data to update the JSON
stored on a gist

3. User clicks offset button

Display Loading messages...

Script
3.1 prepareAttestationRequest
(gist url, jq, Abi)
3.2 all the way to proof
3.3 Call custom function
carbonOffset

Custom Flare contract
function carbonOffset
(proof, rate, recipientAddress)
3.4 - calculates amount of USDT
to bridge
3.5 interacts with Stargate bridge
as a compose message - bridges
USDT to composer contract on Celo

Custom composer contract on Celo
3.6 swap from USDT to CHAR

4. Show dashboard with updated CHAR ownership
