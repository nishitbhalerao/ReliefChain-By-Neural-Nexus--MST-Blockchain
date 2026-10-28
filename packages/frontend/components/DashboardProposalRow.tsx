"use client";

import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useReliefChainContract } from "@/hooks/useReliefChain";
import {
  SpendingProposal,
  formatMST,
  shortAddress,
  proposalStatusLabel,
  proposalStatusBadge,
  txLink,
  addrLink,
} from "@/lib/reliefchain";
import { ROLE_HASHES } from "@/lib/roles";
import { useState } from "react";

const APPROVER_ROLE     = ROLE_HASHES.APPROVER_ROLE;
const ORGANIZATION_ROLE = ROLE_HASHES.ORGANIZATION_ROLE;

interface Props {
  proposalId: bigint;
  filterStatus?: number;
}

export function DashboardProposalRow({ proposalId, filterStatus }: Props) {
  const entry = useReliefChainContract();
  const { address: walletAddress } = useAccount();
  const [acted, setActed] = useState(false);

  const { data: rawProposal, refetch } = useReadContract({
    address: entry?.address,
    abi: entry?.abi,
    functionName: "proposals",
    args: [proposalId],
    query: { enabled: Boolean(entry) },
  });

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
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: pendingHash });

  if (isConfirmed && !acted) {
    setActed(true);
    refetch();
  }

  if (!rawProposal) return null;
  const p = rawProposal as unknown as SpendingProposal;

  // Apply status filter
  if (filterStatus !== undefined && p.status !== filterStatus) return null;

  function action(functionName: string) {
    if (!entry) return;
    writeContract({ address: entry.address, abi: entry.abi, functionName, args: [proposalId] });
  }

  return (
    <tr>
      <td className="muted">#{p.id.toString()}</td>
      <td>
        <Link href={`/campaigns/${p.campaignId.toString()}`} className="hash-link">
          Campaign #{p.campaignId.toString()}
        </Link>
      </td>
      <td>
        <a href={addrLink(p.recipient)} target="_blank" rel="noopener noreferrer" className="hash-link">
          {shortAddress(p.recipient)}
        </a>
      </td>
      <td>{formatMST(p.amount)} MST</td>
      <td>
        <span title={p.purpose} className="truncate" style={{ display: "block", maxWidth: 160 }}>
          {p.purpose}
        </span>
      </td>
      <td>
        <span className={`badge ${proposalStatusBadge(p.status)}`}>{proposalStatusLabel(p.status)}</span>
        {(isPending || isConfirming) && <span className="spin" style={{ marginLeft: 4 }} />}
        {pendingHash && (
          <a href={txLink(pendingHash)} target="_blank" rel="noopener noreferrer" className="hash-link text-xs" style={{ display: "block" }}>
            tx ↗
          </a>
        )}
      </td>
      <td>
        <div className="flex" style={{ gap: "0.3rem" }}>
          {p.status === 0 && (isApprover as boolean) && (
            <>
              <button className="btn btn-sm" style={{ borderColor: "var(--green)", color: "var(--green)" }} disabled={isPending || isConfirming} onClick={() => action("approveSpending")}>✓</button>
              <button className="btn btn-sm btn-danger" disabled={isPending || isConfirming} onClick={() => action("rejectSpending")}>✗</button>
            </>
          )}
          {p.status === 1 && (isOrg as boolean) && (
            <button className="btn btn-sm btn-primary" disabled={isPending || isConfirming} onClick={() => action("executeSpending")}>🚀 Pay</button>
          )}
        </div>
      </td>
    </tr>
  );
}
