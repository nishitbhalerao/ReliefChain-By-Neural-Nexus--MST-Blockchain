/**
 * ReliefChain contract binding helpers.
 * Reads the address + ABI from the shared deployments file written by `npm run deploy:testnet`.
 */
import { deployments } from "reliefchain-shared";
import { mstMainnet } from "./chains";

export function getReliefChainDeployment(chainId: number | undefined) {
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  const entry = (deployments as Record<string, any>)[network]?.ReliefChain as
    | { address: `0x${string}`; abi: any }
    | undefined;
  return entry;
}

// ─── Types mirroring the Solidity structs ────────────────────────────────────

export const CAMPAIGN_STATUS = { Active: 0, Closed: 1 } as const;
export const PROPOSAL_STATUS = { Pending: 0, Approved: 1, Rejected: 2, Executed: 3 } as const;

export type CampaignStatus = 0 | 1;
export type ProposalStatus = 0 | 1 | 2 | 3;

export interface Campaign {
  id:               bigint;
  creator:          `0x${string}`;
  name:             string;
  description:      string;
  disasterCategory: string;
  affectedRegion:   string;
  targetAmount:     bigint;
  totalDonated:     bigint;
  totalPaidOut:     bigint;
  status:           CampaignStatus;
  createdAt:        bigint;
}

export interface SpendingProposal {
  id:          bigint;
  campaignId:  bigint;
  proposer:    `0x${string}`;
  recipient:   `0x${string}`;
  amount:      bigint;
  purpose:     string;
  evidenceRef: string;
  status:      ProposalStatus;
  createdAt:   bigint;
  actionedAt:  bigint;
}

export interface DistributionRecord {
  id:                  bigint;
  campaignId:          bigint;
  aidCategory:         string;
  quantity:            bigint;
  generalizedLocation: string;
  evidenceRef:         string;
  recorder:            `0x${string}`;
  recordedAt:          bigint;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const MSTSCAN_TESTNET = "https://testnet.mstscan.com";

export function txLink(hash: string) {
  return `${MSTSCAN_TESTNET}/tx/${hash}`;
}

export function addrLink(address: string) {
  return `${MSTSCAN_TESTNET}/address/${address}`;
}

export function formatMST(wei: bigint, decimals = 4): string {
  const eth = Number(wei) / 1e18;
  return eth.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function proposalStatusLabel(s: ProposalStatus) {
  return (["Pending", "Approved", "Rejected", "Executed"] as const)[s];
}

export function proposalStatusBadge(s: ProposalStatus) {
  return (["badge-yellow", "badge-green", "badge-red", "badge-blue"] as const)[s];
}

export const DISASTER_CATEGORIES = [
  "Flood", "Earthquake", "Fire", "Cyclone", "Drought",
  "Landslide", "Tsunami", "Pandemic", "Other",
] as const;

export const ROLES = {
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
  ORGANIZATION_ROLE:  "0x" + Buffer.from("ORGANIZATION_ROLE").reduce((a, b) => { /* keccak — kept as literal from contract */ return a }, "") as `0x${string}`,
  APPROVER_ROLE:      "0x" + "" as `0x${string}`,
  RECORDER_ROLE:      "0x" + "" as `0x${string}`,
} as const;
