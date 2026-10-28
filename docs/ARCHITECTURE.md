# ReliefChain — Architecture

## Overview

ReliefChain is a monorepo containing three packages:

```
packages/contracts   — Solidity smart contract + Hardhat tooling
packages/frontend    — Next.js 14 web application
packages/shared      — Auto-generated contract addresses + ABIs
```

---

## Smart Contract: ReliefChain.sol

### Inheritance

```
ReliefChain
  └── AccessControl   (OpenZeppelin) — role-based permissions
  └── ReentrancyGuard (OpenZeppelin) — reentrancy protection on donate() and executeSpending()
  └── Pausable        (OpenZeppelin) — emergency pause by admin
```

### Roles

```
DEFAULT_ADMIN_ROLE  → grants/revokes roles, can pause
ORGANIZATION_ROLE   → createCampaign, proposeSpending, executeSpending
APPROVER_ROLE       → approveSpending, rejectSpending
RECORDER_ROLE       → recordDistribution
```

Deployer receives all four roles at construction.

### On-chain Data Structures

```
campaigns[id]      → Campaign struct
proposals[id]      → SpendingProposal struct
distributions[id]  → DistributionRecord struct
campaignBalance[id]→ uint256 (derived balance = donated - paid)
donorTotals[id][addr] → per-donor cumulative contribution
```

### Spending Proposal State Machine

```
              proposeSpending()
                     │
                  PENDING
                 /       \
   approveSpending()     rejectSpending()
            │                  │
         APPROVED           REJECTED
            │
    executeSpending()
            │
         EXECUTED
```

Invalid transitions revert with `ProposalNotPending` or `ProposalNotApproved`.

### Accounting Invariant

```
campaignBalance[id] = Σ(donations) - Σ(executed payouts)
```

This is maintained atomically:
- `donate()`: adds `msg.value` to `campaignBalance` and `totalDonated`
- `executeSpending()`: subtracts `amount` from `campaignBalance` and adds to `totalPaidOut`
- State updates happen **before** the ETH transfer (checks-effects-interactions pattern)

---

## Frontend: Next.js App Router

### Pages

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, how-it-works, campaign preview |
| `/campaigns` | Paginated campaign discovery |
| `/campaigns/[id]` | Campaign detail — stats, donations, proposals, distributions |
| `/dashboard` | Organization dashboard — own campaigns, pending approvals |

### Key Hooks

| Hook | Source | Purpose |
|---|---|---|
| `useReliefChainContract()` | `hooks/useReliefChain.ts` | Returns `{ address, abi }` for current network |
| `useCampaign(id)` | wagmi `useReadContract` | Reads a single `Campaign` struct |
| `useCampaignTotals(id)` | wagmi `useReadContract` | Reads `(totalDonated, totalPaidOut, balance)` |
| `useReliefChainWrite()` | wagmi `useWriteContract` + `useWaitForTransactionReceipt` | Generic write with tx lifecycle tracking |

### Wallet Connection

Uses wagmi `injected()` connector (MetaMask and other browser extension wallets). Transaction signing happens in the wallet extension — no private keys in browser code.

The MST Testnet RPC does not send CORS headers, so all RPC calls are proxied through `/api/rpc/testnet` (a Next.js route handler that forwards requests server-side).

### Transaction States

All write operations display:
```
Awaiting wallet confirmation → Transaction submitted → Transaction confirmed / failed
```

Every confirmation shows a MSTScan link.

---

## On-chain vs Off-chain Data

| Data | Location | Authoritative? |
|---|---|---|
| Campaign financials | Smart contract | ✅ Yes |
| Donation totals | Smart contract events + state | ✅ Yes |
| Proposal status | Smart contract | ✅ Yes |
| Payout execution | Smart contract | ✅ Yes |
| Campaign description | Smart contract (stored on-chain) | ✅ Yes |
| Evidence documents | Off-chain (URL/IPFS ref stored on-chain) | ❌ Reference only |
| Distribution records | Smart contract events | ✅ Yes (claimed, not verified) |

---

## Deployment Flow

```
1. npm run compile          → compiles Solidity, generates TypeChain types
2. npm run test             → 44 tests on local Hardhat node
3. npm run deploy:testnet   → deploys ReliefChain.sol to MST Testnet
                             → writes address + ABI to packages/shared/src/contracts.ts
4. npm run dev              → starts Next.js dev server, reads from shared/contracts.ts
```

---

## Security Design

- **No admin withdrawal function** — funds can only leave via executed spending proposals
- **Reentrancy guard** — `donate()` and `executeSpending()` are nonReentrant
- **Checks-effects-interactions** — state updated before ETH transfer in `executeSpending()`
- **Transfer failure reverts** — if `call{value}` fails, the entire transaction reverts
- **Role separation** — proposer and approver are separate roles
- **On-chain authorization** — hiding a button in the UI is not authorization; the contract enforces it
- **Private beneficiary data excluded** — no names, phone numbers, or precise addresses stored on-chain
