"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useProposalCount, useReliefChainContract } from "@/hooks/useReliefChain";
import { ProposalRow } from "./ProposalRow";

interface Props {
  campaignId: bigint;
  onRefresh: () => void;
}

export function ProposalList({ campaignId, onRefresh }: Props) {
  const { data: countRaw } = useProposalCount();
  const count = countRaw ? Number(countRaw) : 0;

  // Build IDs descending
  const allIds: bigint[] = [];
  for (let i = count; i >= 1; i--) {
    allIds.push(BigInt(i));
  }

  return (
    <div className="card mt-3">
      <h2 className="font-bold mb-2">Spending Proposals</h2>
      {allIds.length === 0 ? (
        <p className="muted text-sm">No spending proposals yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allIds.map((id) => (
                <ProposalRow
                  key={id.toString()}
                  proposalId={id}
                  campaignId={campaignId}
                  onRefresh={onRefresh}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
