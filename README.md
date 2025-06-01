![LG-full-slide](https://github.com/user-attachments/assets/e478e8ad-17ee-493d-a43f-788f8593d1fc)


# LayerGreen: Seamless Cross-Chain Carbon Offsetting

LayerGreen is a user-friendly platform that empowers individuals to understand and neutralize their blockchain carbon footprint. By analyzing transaction history on networks like Flare, we provide a clear visualization of carbon emissions and offer a streamlined, one-click solution to offset these emissions by acquiring tokenized carbon credits (NCT) on Polygon.

**Our Vision:** To make carbon offsetting accessible, transparent, and verifiable through the power of blockchain technology, enabling users to take meaningful climate action.

**Webapp is live at:** [layergreen.xyz](https://www.layergreen.xyz/)

## Key Features

*   **Wallet Carbon Footprint Analysis:** Simply enter an EVM-compatible wallet address to view its transaction history and estimated carbon emissions, initially supporting the Flare Network.
*   **Intuitive Dashboard:**
    *   **Transaction History:** View recent transactions and associated gas usage, leveraging Blockscout's comprehensive explorer data for the Flare network.
    *   **Carbon Emissions Breakdown:** Understand the environmental impact of your on-chain activities.
    *   **NCT Balance on Polygon:** Track your Toucan Protocol NCT (Nature Carbon Tonne) token balance, a verified carbon credit, with easy links to view on Blockscout.
*   **One-Click Offsetting:** Seamlessly offset your calculated carbon footprint.
*   **Cross-Chain Operations:** Utilizes LayerZero to bridge USDC from the Flare Network to Polygon, where NCT carbon credits are acquired.
*   **Secure & User-Friendly:** Integrated with Privy for easy and secure wallet connections.
*   **Visually Engaging:** Features an animated background that responds to scroll, creating an immersive user experience.

## How It Works

1.  **Connect & Analyze:** Users connect their wallet (or enter any public address) via Privy. The platform fetches transaction history from the Flare Network using its public explorer API (powered by Blockscout).
2.  **Calculate & Visualize:** Off-chain logic calculates the estimated carbon footprint based on gas consumed. This, along with the NCT balance on Polygon (queried directly from the Polygon blockchain and verifiable on Blockscout), is displayed on a user-friendly dashboard.
3.  **Offset with Confidence:**
    *   The user decides to offset their emissions.
    *   The required amount of USDC is prepared on the Flare Network.
    *   Our backend smart contracts (see `CarbonHardhat` repository) orchestrate a LayerZero-powered bridge to transfer these funds to Polygon.
    *   On Polygon, another smart contract (see `carbonswap` repository) automatically swaps the bridged USDC for NCT tokens.
4.  **Verify:** The user's updated NCT balance, reflecting the newly acquired carbon credits, is displayed on the dashboard.

## Technical Stack

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
*   **Wallet Connection & Authentication:** Privy
*   **Blockchain Interaction (Frontend):** Viem, Wagmi
*   **State Management/Data Fetching:** TanStack Query
*   **Animation:** GSAP (GreenSock Animation Platform)
*   **Supported Chains (Current):**
    *   **Flare Network:** For initial transaction analysis and sourcing funds for offsetting.
    *   **Polygon:** For acquiring NCT (Nature Carbon Tonne) tokenized carbon credits.
*   **Key Integrations:**
    *   **Blockscout:** Utilized for displaying Flare transaction history and Polygon NCT token balances, providing transparency and easy verification for users.
    *   **LayerZero:** Powers the cross-chain bridging of assets from Flare to Polygon (details in `CarbonHardhat`).
    *   **Toucan Protocol:** For NCT carbon credits on Polygon.

## Project Repositories

This project is composed of multiple repositories:

*   🌍 **`CarbonOffset` (This Repository):** The frontend application providing the user interface and experience.
    *   [https://github.com/deca12x/CarbonOffset/](https://github.com/deca12x/CarbonOffset/)
*   🔥 **`CarbonHardhat`:** Contains the Flare-side smart contracts responsible for initiating the LayerZero bridge and interacting with Flare-specific functionalities.
    *   [https://github.com/deca12x/CarbonHardhat](https://github.com/deca12x/CarbonHardhat)
*   🔄 **`carbonswap`:** Contains the Polygon-side smart contract (TokenSwapComposer) that receives bridged assets and swaps them for NCT tokens.
    *   [https://github.com/frosimanuel/carbonswap](https://github.com/frosimanuel/carbonswap)

## Getting Started (Frontend)

### Prerequisites

*   Node.js (v18 or later recommended)
*   Yarn or npm

### Environment Variables

Create a `.env.local` file in the root of the `CarbonOffset` directory and add your Privy App ID:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
```

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/deca12x/CarbonOffset.git
    cd CarbonOffset
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Future Enhancements

*   Support for analyzing and offsetting emissions on additional EVM chains.
*   More granular carbon footprint calculation methodologies.
*   Direct integration with Flare Data Connector for on-chain data attestations related to carbon calculations.
*   User profiles and historical offsetting records.
*   Gamification and rewards for offsetting (potentially using Blockscout Merits).

---

Built with passion for a greener Web3.
