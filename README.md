# Decentralized Voting Application

A tamper-proof voting platform built on the Ethereum blockchain using Solidity smart contracts, ensuring transparent and secure elections with immutable vote recording. The React.js frontend integrates with MetaMask for wallet-based authentication and real-time voter participation.

**Tech stack:** Blockchain, Ethereum, Solidity, React.js, Web3.js, Three.js

## Design

The UI centers on a **3D interactive glass ballot box** (built with Three.js / React Three Fiber) that sits in the hero section — it rotates gently, glows while the election is live, and drops a brass token into the box with a physical falling animation every time a vote is cast. Candidate cards use real 3D tilt-on-hover (mouse-tracked perspective transforms) with a liquid-fill gauge for vote counts. Palette and type (Fraunces serif + Inter + JetBrains Mono) lean into a "civic ledger" feel — ceremonial, not corporate-crypto.

Extra frontend dependencies for this: `three`, `@react-three/fiber`, `@react-three/drei` (already in `frontend/package.json`).

---

## Project Structure

```
voting-dapp/
├── contracts/
│   └── Voting.sol           # Main smart contract
├── scripts/
│   └── deploy.js             # Deployment script
├── test/
│   └── Voting.test.js        # Contract unit tests
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js            # Main React component (MetaMask + Web3.js)
│       ├── App.css
│       ├── index.js
│       └── contract-config.js  # Contract address + ABI
├── hardhat.config.js
├── package.json
└── .env.example
```

## How It Works

- **Admin** (the wallet that deploys the contract) adds candidates and registers eligible voter wallet addresses.
- **Registered voters** connect via MetaMask and cast exactly one vote each. The vote is written on-chain and cannot be changed — that's what makes it "tamper-proof."
- Once the admin ends the election, anyone can view the winner and full vote tallies.

## Setup — Smart Contract (Backend)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - An RPC URL from [Alchemy](https://www.alchemy.com) or [Infura](https://www.infura.io) — free tier is enough
   - Your MetaMask private key (Account details → Export Private Key). **Never share this or commit `.env`.**

   > Note: Goerli testnet (mentioned as the original test network) was deprecated by Ethereum in 2024.
   > Use **Sepolia** instead — it's the current standard Ethereum testnet. Both configs are included in `hardhat.config.js` in case your instructor/reviewer specifically wants Goerli-style setup for parity with older tutorials.

3. Get free Sepolia test ETH from a faucet (e.g. [sepoliafaucet.com](https://sepoliafaucet.com) or Alchemy's faucet) to pay gas fees.

4. Compile the contract:
   ```bash
   npm run compile
   ```

5. Run tests:
   ```bash
   npm test
   ```

6. Deploy to Sepolia testnet:
   ```bash
   npm run deploy:sepolia
   ```
   Copy the printed contract address into `frontend/src/contract-config.js` as `CONTRACT_ADDRESS`.

## Setup — Frontend (React)

```bash
cd frontend
npm install
npm start
```

Opens at `http://localhost:3000`. Make sure MetaMask is installed in your browser and switched to the Sepolia network.

## Deploying the Frontend to IPFS

As mentioned in the resume bullet, the frontend can be pinned to IPFS for decentralized hosting:

1. Build the production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Install the IPFS CLI (`ipfs` / Kubo) or use a pinning service like [Fleek](https://fleek.co) or [Pinata](https://pinata.cloud).
3. Using Pinata (easiest, no local IPFS node needed):
   - Sign up at pinata.cloud
   - Upload the `frontend/build` folder
   - Pinata gives you a public gateway URL (`https://gateway.pinata.cloud/ipfs/<CID>`) — this is your live decentralized frontend link.

## What Each Resume Bullet Maps To

| Resume claim | Where it lives in this repo |
|---|---|
| Tamper-proof voting platform, Ethereum + Solidity | `contracts/Voting.sol` — `vote()`, `registerVoter()`, immutable on-chain storage |
| Transparent and secure elections, immutable vote recording | Events (`VoteCast`, `CandidateAdded`) + `mapping` storage, one-vote-per-address enforcement |
| Responsive React.js frontend + MetaMask auth | `frontend/src/App.js` — `connectWallet()` using `window.ethereum` |
| Real-time voter participation | Candidate vote counts reload live after each `vote()` transaction |
| Deployed frontend on IPFS | See "Deploying the Frontend to IPFS" above |
| Tested on Goerli Testnet | `hardhat.config.js` networks — use Sepolia in practice, Goerli config included for reference |
| Evaluated layer-2 scaling solutions | See note below |

### Note on "Layer-2 scaling solutions"
This repo deploys to Ethereum L1 testnet directly, which is the right starting point. If you want this bullet to be fully accurate before an interview, a natural next step is redeploying the same `Voting.sol` contract unchanged to a Layer-2 testnet (e.g. **Polygon Amoy** or **Arbitrum Sepolia**) via Hardhat, and comparing gas costs / confirmation times against Sepolia L1. I can help you set that up too — just ask.

## Talking Points for Interviews

- Why a mapping-based `Voter` struct instead of an array (O(1) lookups, prevents double-voting cheaply).
- Trade-off of storing votes on-chain (transparent, immutable) vs. off-chain with on-chain hash commitments (cheaper gas, still verifiable).
- Access control via `onlyOwner` modifier and why a real system might want multi-sig admin instead of a single address.
- Reentrancy is not a risk here since `vote()` doesn't send ETH or call external contracts — worth mentioning you considered it.
