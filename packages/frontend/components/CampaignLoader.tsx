"use client";

import { useCampaignCount } from "@/hooks/useReliefChain";
import { CampaignCardFetcher } from "./CampaignCardFetcher";

interface Props {
  limit?: number;
  filterCreator?: `0x${string}`;
}

export function CampaignLoader({ limit, filterCreator }: Props) {
  const { data: countRaw, isLoading } = useCampaignCount();
  const count = countRaw ? Number(countRaw) : 0;

  if (isLoading) {
    return <p className="muted text-sm">Loading campaigns…</p>;
  }
  if (count === 0) {
    return (
      <div className="empty-state">
        <p>No campaigns yet.</p>
        <p className="text-sm mt-1">Be the first to create a relief campaign.</p>
      </div>
    );
  }

  // Build IDs descending (newest first), apply limit
  const ids: bigint[] = [];
  for (let i = count; i >= 1; i--) {
    ids.push(BigInt(i));
  }
  const displayed = limit ? ids.slice(0, limit) : ids;

  return (
    <div className="campaign-grid">
      {displayed.map((id) => (
        <CampaignCardFetcher key={id.toString()} campaignId={id} filterCreator={filterCreator} />
      ))}
    </div>
  );
}
