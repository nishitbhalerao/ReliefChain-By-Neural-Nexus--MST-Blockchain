# ReliefChain

**Every Donation Should Tell a Story.**

A blockchain-powered disaster-relief donation and fund-management platform built on [MST Blockchain](https://docs.mstblockchain.com) for MST Blockchain Buildathon 2.0 — Round 2.

---

## Live Demo

> Start the app locally with `npm run dev` (see Setup below).

- **Contract address (MST Testnet):** `0x86777dC5ec42c60627C787e94652e384EA561C17`
- **MSTScan:** https://testnet.mstscan.com/address/0x86777dC5ec42c60627C787e94652e384EA561C17
- **Network:** MST Testnet · Chain ID `91562037`

> ⚠️ This is a testnet demonstration. All transactions use MST Testnet tokens — **not real-money charitable donations.**

---

## Features

| Feature | Status |
|---|---|
| Campaign creation (on-chain) | ✅ |
| Donor contributions (native MST token) | ✅ |
| Smart-contract-held funds | ✅ |
| Spending proposal submission | ✅ |
| Independent approval / rejection | ✅ |
| Approved payout execution | ✅ |
| Aid-distribution records | ✅ |
| Role-based access control | ✅ |
| Public transparency dashboard | ✅ |
| MSTScan transaction links | ✅ |
| Wallet connection (Bridgekey) | ✅ |
| Wrong-network detection & switch prompt | ✅ |
| Campaign accounting (donated / paid / balance) | ✅ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity 0.8.20, Hardhat, OpenZeppelin 5 |
| Blockchain | MST Testnet (Chain ID 91562037) |
| Frontend | Next.js 14, React 18, TypeScript |
| Wallet | wagmi v2 + viem (injected connector) |
| Monorepo | npm workspaces + Turborepo |
| Contract deployment | Hardhat deploy script → `shared/src/contracts.ts` |

---

## Project Structure

```
reliefchain/
├── packages/
│   ├── contracts/
│   │   ├── contracts/ReliefChain.sol   ← main contract
│   │   ├── test/ReliefChain.test.ts    ← 44 automated tests
│   │   ├── scripts/deploy.ts
│   │   ├── deploy.config.ts
│   │   └── hardhat.config.ts
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── page.tsx                ← landing page
│   │   │   ├── campaigns/page.tsx      ← campaign list
│   │   │   ├── campaigns/[id]/page.tsx ← campaign detail
│   │   │   └── dashboard/page.tsx      ← org dashboard
│   │   ├── components/                 ← UI components
│   │   ├── hooks/useReliefChain.ts     ← contract read/write hooks
│   │   └── lib/
│   │       ├── reliefchain.ts          ← types & helpers
│   │       ├── roles.ts                ← on-chain role hashes
│   │       ├── chains.ts               ← MST chain definitions
│   │       └── wagmi.ts                ← wagmi config
│   └── shared/
│       └── src/contracts.ts            ← auto-generated ABI + address
└── .env.example
```

---

## Setup

### Prerequisites
- Node.js ≥ 18.18
- A browser wallet  configured for MST Testnet
- MST Testnet tokens from https://faucet.masterstroke.academy

### 1. Install dependencies
```bash
npm install
```

### 2. Configure secrets
```bash
cp .env.example .env.local
# Edit .env.local — add your PRIVATE_KEY (funded testnet account)
```

### 3. Run tests
```bash
npm run test
# 44 passing
```

### 4. Deploy contract (already deployed — skip if demoing)
```bash
npm run deploy:testnet
# Writes address + ABI to packages/shared/src/contracts.ts automatically
```

### 5. Start the frontend
```bash
npm run dev
# Frontend: http://localhost:3000
```

---

## Smart Contract

**File:** `packages/contracts/contracts/ReliefChain.sol`

### Roles

| Role | Capability |
|---|---|
| `DEFAULT_ADMIN_ROLE` | Grant/revoke all roles, pause contract |
| `ORGANIZATION_ROLE` | Create campaigns, submit and execute spending proposals |
| `APPROVER_ROLE` | Approve or reject pending proposals |
| `RECORDER_ROLE` | Record aid-distribution events |

The deployer wallet receives all four roles at deployment.

### Spending Proposal State Machine

```
PENDING → APPROVED → EXECUTED
PENDING → REJECTED
```

Transitions are enforced in the contract. An executed or rejected proposal cannot be reused.

### Accounting Model

For every campaign:
```
campaignBalance[id] = totalDonated - totalPaidOut
```

- Updated atomically on `donate()` and `executeSpending()`
- Pending/approved proposals do **not** reduce the balance until execution
- `InsufficientCampaignBalance` revert prevents overspending at both proposal and execution time

---

## Test Results

```
44 passing
```

Covers: campaign creation, donations, spending proposals, approve/reject/execute, accounting integrity, distribution records, pause, role management, reentrancy guards.

---

## Demo Workflow

1. Connect MetaMask → switch to MST Testnet (Chain ID 91562037)
2. **Create campaign:** Campaigns → + Create Campaign
3. **Donate:** Open campaign → Donate → enter amount → confirm in wallet
4. **Propose spending:** Campaign → Propose Spending → fill form → submit
5. **Approve:** Dashboard → Proposals Awaiting Approval → ✓ Approve
6. **Execute payout:** Dashboard → All Proposals → 🚀 Pay
7. **Verify:** All transaction hashes link to https://testnet.mstscan.com

---

## Security Limitations

- Contract is **unaudited** — do not use for real charitable funds
- APPROVER_ROLE and ORGANIZATION_ROLE are currently granted to the deployer — separate wallets should be used in production
- Evidence references are off-chain URLs; their content is not verified on-chain
- Distribution records are claimed deliveries, not independently verified physical aid

---

## Known Limitations

- No WalletConnect (requires a paid WalletConnect Project ID in `.env.local`)
- The ProposalList shows all proposals across all campaigns; filter by `campaignId` is client-side
- No pagination — fine for testnet volumes, would need server-side indexing for mainnet scale
- Source verification on MSTScan requires `MSTSCAN_API_KEY` in `.env.local`

---

## License

MIT
