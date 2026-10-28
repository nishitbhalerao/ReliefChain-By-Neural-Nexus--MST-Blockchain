"use client";

import { useProposalCount, useReliefChainContract } from "@/hooks/useReliefChain";
import { DashboardProposalRow } from "./DashboardProposalRow";

interface Props {
  filterStatus?: number; // 0=Pending,1=Approved,2=Rejected,3=Executed
}

export function DashboardProposalsList({ filterStatus }: Props) {
  const { data: countRaw } = useProposalCount();
  const count = countRaw ? Number(countRaw) : 0;

  if (count === 0) {
    return <p className="muted text-sm">No proposals yet.</p>;
  }

  const ids: bigint[] = [];
  for (let i = count; i >= 1; i--) ids.push(BigInt(i));

  return (
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Campaign</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => (
              <DashboardProposalRow
                key={id.toString()}
                proposalId={id}
                filterStatus={filterStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
