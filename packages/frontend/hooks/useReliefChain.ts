"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { getReliefChainDeployment } from "@/lib/reliefchain";

/**
 * Returns the deployment entry { address, abi } for the connected network.
 */
export function useReliefChainContract() {
  const { chainId } = useAccount();
  return getReliefChainDeployment(chainId);
}

/**
 * Read a single campaign by ID.
 */
export function useCampaign(campaignId: bigint | undefined) {
  const entry = useReliefChainContract();
  return useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "getCampaign",
    args: campaignId !== undefined ? [campaignId] : undefined,
    query: { enabled: Boolean(entry && campaignId !== undefined) },
  });
}

/**
 * Read campaign accounting totals.
 */
export function useCampaignTotals(campaignId: bigint | undefined) {
  const entry = useReliefChainContract();
  return useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "getCampaignTotals",
    args: campaignId !== undefined ? [campaignId] : undefined,
    query: { enabled: Boolean(entry && campaignId !== undefined) },
  });
}

/**
 * Read total campaign count.
 */
export function useCampaignCount() {
  const entry = useReliefChainContract();
  return useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "campaignCount",
    query: { enabled: Boolean(entry) },
  });
}

/**
 * Read total proposal count.
 */
export function useProposalCount() {
  const entry = useReliefChainContract();
  return useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "proposalCount",
    query: { enabled: Boolean(entry) },
  });
}

/**
 * Read a spending proposal by ID.
 */
export function useProposal(proposalId: bigint | undefined) {
  const entry = useReliefChainContract();
  return useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "proposals",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: Boolean(entry && proposalId !== undefined) },
  });
}

/**
 * Check if an address has a specific role.
 */
export function useHasRole(role: `0x${string}` | undefined, address: `0x${string}` | undefined) {
  const entry = useReliefChainContract();
  return useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "hasRole",
    args: role && address ? [role, address] : undefined,
    query: { enabled: Boolean(entry && role && address) },
  });
}

/**
 * Generic write hook — wraps wagmi's useWriteContract.
 */
export function useReliefChainWrite() {
  const entry = useReliefChainContract();
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash: txHash });

  function write(functionName: string, args: unknown[], value?: bigint) {
    if (!entry) throw new Error("Contract not deployed on this network");
    writeContract({
      address: entry.address,
      abi: entry.abi,
      functionName,
      args,
      value,
    });
  }

  return { write, txHash, isPending, isConfirming, isConfirmed, receipt, error, reset };
}
