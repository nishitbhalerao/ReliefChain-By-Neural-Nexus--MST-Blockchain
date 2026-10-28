# ReliefChain

**Every Donation Should Tell a Story.**

ReliefChain is a disaster-relief donation platform built on MST Blockchain. Every donation, spending approval, and fund payout is recorded on-chain so anyone can verify where the money went.

Built for **MST Blockchain Buildathon 2.0 — Round 2**.

---

## Demo Video

Watch the full walkthrough here:
**[https://drive.google.com/file/d/1bNv19H0dqtFlGy3XL45FBTR3gDRqpn5I/view?usp=drivesdk](https://drive.google.com/file/d/1bNv19H0dqtFlGy3XL45FBTR3gDRqpn5I/view?usp=drivesdk)**

---

## Live Contract

| | |
|---|---|
| Contract Address | `0x86777dC5ec42c60627C787e94652e384EA561C17` |
| Network | MST Testnet — Chain ID `91562037` |
| Explorer | https://testnet.mstscan.com/address/0x86777dC5ec42c60627C787e94652e384EA561C17 |
| Required Wallet | BridgeKey (see wallet section below) |

> This is a testnet demo. All transactions use test tokens, not real money.

---

## The Problem

When people donate to disaster relief, they rarely know if the money actually reached the victims. Aid organizations self-report their spending, and there is no independent way to check. ReliefChain fixes this by putting the entire donation and fund-management process on a public blockchain, where every transaction is permanent and visible to anyone.

---

## Why MST Blockchain

ReliefChain runs on MST Blockchain for three main reasons:

1. **Low fees.** On Ethereum, a single donation transaction can cost more than the donation itself in gas fees. MST Blockchain keeps fees low so more of each donation reaches the contract.

2. **BridgeKey wallet.** BridgeKey is the official MST wallet. It adds the MST Testnet network automatically when you first connect, so donors do not need to configure anything manually.

3. **MSTScan explorer.** Every transaction is searchable on [MSTScan](https://testnet.mstscan.com). Donors can paste any transaction hash and see exactly what happened, without needing an account or trusting anyone.

---

## How It Works

ReliefChain uses a smart contract as an escrow. Funds only leave the contract after a multi-step approval process. No single person can release money on their own.

```
Donor         →  donate()             →  Contract holds funds
Organization  →  proposeSpending()    →  Contract records proposal
Approver      →  approveSpending()    →  Contract marks proposal approved
Organization  →  executeSpending()    →  Contract sends funds to recipient
Field worker  →  recordDistribution() →  Contract logs aid delivery
```

Every one of these steps is a blockchain transaction visible on MSTScan.

---

## Screenshots

### Campaign Page — BridgeKey Connected

![Campaign page with BridgeKey wallet connected] <img width="1917" height="1078" alt="Screenshot 2026-10-28 220344" src="https://github.com/user-attachments/assets/bbb18222-9328-40f1-bffe-436e8de6973e" />
)

The Nepal Disaster Help campaign page. BridgeKey wallet is connected in the top right, showing the wallet address and MST balance. The BridgeKey activity panel shows two successful contract interactions.

---

### Contract on MSTScan

![Contract details on MSTScan] <img width="1900" height="1050" alt="Screenshot 2026-10-28 222211" src="https://github.com/user-attachments/assets/f5ed6227-cec8-4eae-9cc8-985303949c20" />
)

The deployed ReliefChain contract at `0x86777dC5ec42c60627C787e94652e384EA561C17` on the MST Testnet explorer. Creator `0xF3...27aC`, deployment marked as Success.

---

### Operator Dashboard

![Dashboard showing wallet, roles, and contract details] <img width="1917" height="1078" alt="Screenshot 2026-10-28 220359" src="https://github.com/user-attachments/assets/6391391f-c93f-489e-9738-153390c5adb9" />
)

The operator dashboard showing the connected BridgeKey wallet with 49.9966 MST, all four assigned roles (Admin, Organization, Approver, Recorder), and the deployed contract address.

---

## Features

| Feature | Status |
|---|---|
| Create campaigns on-chain | Done |
| Accept donations in native MST token | Done |
| Hold funds in smart contract escrow | Done |
| Submit spending proposals | Done |
| Approve or reject proposals (independent role) | Done |
| Execute approved payouts | Done |
| Record aid distribution on-chain | Done |
| Role-based access control | Done |
| Public transparency dashboard | Done |
| MSTScan links on every transaction | Done |
| BridgeKey wallet connection | Done |
| Wrong network detection and switch prompt | Done |
| Per-campaign accounting (donated / paid / balance) | Done |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity 0.8.20, Hardhat, OpenZeppelin 5 |
| Blockchain | MST Testnet (Chain ID 91562037) |
| Frontend | Next.js 14, React 18, TypeScript |
| Wallet | wagmi v2 + viem, BridgeKey wallet |
| Monorepo | npm workspaces + Turborepo |

---

## Project Structure

```
reliefchain/
├── packages/
│   ├── contracts/
│   │   ├── contracts/ReliefChain.sol     main smart contract
│   │   ├── test/ReliefChain.test.ts      44 automated tests
│   │   ├── scripts/deploy.ts             deployment script
│   │   └── hardhat.config.ts             network configuration
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── page.tsx                  landing page
│   │   │   ├── campaigns/page.tsx        campaign list
│   │   │   ├── campaigns/[id]/page.tsx   campaign detail and donate
│   │   │   └── dashboard/page.tsx        operator dashboard
│   │   ├── components/                   UI components
│   │   ├── hooks/useReliefChain.ts       contract read/write hooks
│   │   └── lib/
│   │       ├── wagmi.ts                  wallet configuration
│   │       └── chains.ts                 MST chain definitions
│   └── shared/
│       └── src/contracts.ts              auto-generated ABI and address
└── .env.example
```

---

## Setup

### What you need

- Node.js version 18.18 or higher
- [BridgeKey wallet](https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg) Chrome extension
- MST Testnet tokens from [faucet.masterstroke.academy](https://faucet.masterstroke.academy)

### Steps

**1. Install dependencies**

```bash
npm install
```

**2. Set up your environment file**

```bash
cp .env.example .env.local
```

Open `.env.local` and set `PRIVATE_KEY` to a funded MST Testnet account. Never commit this file.

**3. Run the tests**

```bash
npm run test
# 44 passing
```

**4. Start the app**

```bash
npm run dev
# Opens at http://localhost:3000
```

**5. Deploy the contract** (already deployed — skip this for demos)

```bash
npm run deploy:testnet
# Deployed address: 0x86777dC5ec42c60627C787e94652e384EA561C17
```

---

## BridgeKey Wallet

This app uses **BridgeKey** as its wallet. BridgeKey is the official wallet for MST Blockchain. MetaMask is not supported.

**How to set up BridgeKey:**

1. Install [BridgeKey](https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg) from the Chrome Web Store
2. Open BridgeKey and create a new wallet or import an existing one
3. Get free test tokens from [faucet.masterstroke.academy](https://faucet.masterstroke.academy)
4. Go to http://localhost:3000 and click **Connect BridgeKey**
5. BridgeKey will add the MST Testnet network automatically

> If you have MetaMask installed as well, disable it at `chrome://extensions` before connecting. Both extensions compete for the same browser API, and MetaMask can take priority.

---

## Smart Contract

**File:** `packages/contracts/contracts/ReliefChain.sol`  
**Deployed address:** `0x86777dC5ec42c60627C787e94652e384EA561C17`  
**Explorer:** https://testnet.mstscan.com/address/0x86777dC5ec42c60627C787e94652e384EA561C17

### Roles

| Role | What it can do |
|---|---|
| `DEFAULT_ADMIN_ROLE` | Grant or revoke all roles, pause the contract |
| `ORGANIZATION_ROLE` | Create campaigns, propose spending, execute payouts |
| `APPROVER_ROLE` | Approve or reject pending spending proposals |
| `RECORDER_ROLE` | Record aid distribution events |

The deployer wallet gets all four roles at deployment time. In a real deployment these should be separate wallets.

### Proposal States

```
PENDING  →  APPROVED  →  EXECUTED
PENDING  →  REJECTED
```

Once a proposal is executed or rejected it cannot be changed or reused.

### Fund Accounting

For each campaign the contract tracks:

```
balance = total donated - total paid out
```

The balance updates immediately when someone donates or when a payout executes. A proposal that is pending or approved does not reduce the balance until it is actually executed. The contract will revert if a proposal tries to pay out more than the current balance.

---

## Demo Workflow

1. Install BridgeKey and fund it from the faucet
2. Open the app and click Connect BridgeKey
3. Go to Campaigns and click **+ New Campaign**, fill in the details and submit
4. Open the campaign and click **Donate**, enter an amount and confirm in BridgeKey
5. Click **Propose Spending**, fill in recipient, amount, and purpose, then submit
6. Go to Dashboard and approve the proposal under **Proposals Awaiting Approval**
7. Click **Pay** on the approved proposal to execute the on-chain transfer
8. Click **Record Distribution** to log the aid delivery on-chain
9. Check every transaction on https://testnet.mstscan.com

---

## Test Results

```
44 passing
```

Tests cover: campaign creation, donations, spending proposals, approvals, rejections, payout execution, accounting accuracy, distribution records, pause functionality, role access control, and reentrancy protection.

---

## Security Notes

- The contract is unaudited. Do not use it for real charitable donations.
- Funds can only leave the contract through an executed spending proposal. There is no admin withdrawal function.
- The `donate()` and `executeSpending()` functions are protected against reentrancy attacks.
- State is always updated before any ETH transfer.
- Role separation means the person proposing a spend cannot also approve it.

---

## Known Limitations

- No WalletConnect support (requires a paid project ID in `.env.local`)
- Evidence URLs are plain strings stored on-chain, not verified content
- No server-side pagination (fine for testnet scale)
- Source verification on MSTScan requires `MSTSCAN_API_KEY` in `.env.local`

---

## License

MIT
