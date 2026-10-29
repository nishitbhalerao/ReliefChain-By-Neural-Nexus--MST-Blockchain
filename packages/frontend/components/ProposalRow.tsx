"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  SpendingProposal,
  formatMST,
  shortAddress,
  proposalStatusLabel,
  proposalStatusBadge,
  txLink,
  addrLink,
} from "@/lib/reliefchain";
import { useReliefChainContract } from "@/hooks/useReliefChain";
import { useState } from "react";
import { TxStatus } from "./TxStatus";
import { IconCheck, IconX, IconRocket } from "./Icons";

import { ROLE_HASHES } from "@/lib/roles";
const APPROVER_ROLE     = ROLE_HASHES.APPROVER_ROLE;
const ORGANIZATION_ROLE = ROLE_HASHES.ORGANIZATION_ROLE;

interface Props {
  proposalId: bigint;
  campaignId: bigint;
  onRefresh: () => void;
}

export function ProposalRow({ proposalId, campaignId, onRefresh }: Props) {
  const entry = useReliefChainContract();
  const { address: walletAddress } = useAccount();
  const [actionHash, setActionHash] = useState<`0x${string}` | undefined>();

  // Read the proposal
  const { data: rawProposal, refetch } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "proposals",
    args: [proposalId],
    query: { enabled: Boolean(entry) },
  });

  // Role checks
  const { data: isApprover } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "hasRole",
    args: walletAddress ? [APPROVER_ROLE, walletAddress] : undefined,
    query: { enabled: Boolean(entry && walletAddress) },
  });
  const { data: isOrg } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "hasRole",
    args: walletAddress ? [ORGANIZATION_ROLE, walletAddress] : undefined,
    query: { enabled: Boolean(entry && walletAddress) },
  });

  const { writeContract, isPending, data: pendingHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingHash,
  });

  if (isConfirmed && pendingHash !== actionHash) {
    setActionHash(pendingHash);
    refetch();
    onRefresh();
  }

  if (!rawProposal) return null;

  // rawProposal is a tuple returned from mapping getter
  const p = rawProposal as unknown as SpendingProposal;

  // Only show proposals for this campaign
  if (p.campaignId !== campaignId) return null;

  const statusLabel = proposalStatusLabel(p.status);
  const statusBadge = proposalStatusBadge(p.status);

  function action(functionName: string) {
    if (!entry) return;
    writeContract({
      address: entry.address,
      abi: entry.abi,
      functionName,
      args: [proposalId],
    });
  }

  return (
    <tr>
      <td className="muted">#{p.id.toString()}</td>
      <td>
        <a href={addrLink(p.recipient)} target="_blank" rel="noopener noreferrer" className="hash-link">
          {shortAddress(p.recipient)}
        </a>
      </td>
      <td>{formatMST(p.amount)} MST</td>
      <td style={{ maxWidth: 200 }}>
        <span title={p.purpose} className="truncate" style={{ display: "block", maxWidth: 180 }}>
          {p.purpose}
        </span>
        {p.evidenceRef && (
          <a href={p.evidenceRef} target="_blank" rel="noopener noreferrer" className="hash-link text-xs">
            evidence ↗
          </a>
        )}
      </td>
      <td>
        <span className={`badge ${statusBadge}`}>{statusLabel}</span>
        {(isPending || isConfirming) && <span className="spin" style={{ marginLeft: 6 }} />}
        {(pendingHash) && (
          <a href={txLink(pendingHash)} target="_blank" rel="noopener noreferrer" className="hash-link text-xs" style={{ display: "block" }}>
            tx ↗
          </a>
        )}
      </td>
      <td>
        <div className="flex" style={{ gap: "0.35rem" }}>
          {p.status === 0 && (isApprover as boolean) && (
            <>
              <button
                className="btn btn-sm"
                style={{ borderColor: "var(--green)", color: "var(--green)", display: "flex", alignItems: "center", gap: "0.25rem" }}
                disabled={isPending || isConfirming}
                onClick={() => action("approveSpending")}
                title="Approve this proposal"
              >
                <IconCheck size="0.85em" /> Approve
              </button>
              <button
                className="btn btn-sm btn-danger"
                style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
                disabled={isPending || isConfirming}
                onClick={() => action("rejectSpending")}
                title="Reject this proposal"
              >
                <IconX size="0.85em" /> Reject
              </button>
            </>
          )}
          {p.status === 1 && (isOrg as boolean) && (
            <button
              className="btn btn-sm btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
              disabled={isPending || isConfirming}
              onClick={() => action("executeSpending")}
              title="Execute payout"
            >
              <IconRocket size="0.85em" /> Execute
            </button>
          )}
          {p.status === 3 && (
            <span className="text-xs muted">Paid out</span>
          )}
          {p.status === 2 && (
            <span className="text-xs muted">Rejected</span>
          )}
        </div>
      </td>
    </tr>
  );
}
