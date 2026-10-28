"use client";

import { useCampaign } from "@/hooks/useReliefChain";
import { CampaignCard } from "./CampaignCard";
import type { Campaign } from "@/lib/reliefchain";

interface Props {
  campaignId: bigint;
  filterCreator?: `0x${string}`;
}

export function CampaignCardFetcher({ campaignId, filterCreator }: Props) {
  const { data, isLoading, error } = useCampaign(campaignId);

  if (isLoading) {
    return (
      <div className="campaign-card" style={{ justifyContent: "center", alignItems: "center", minHeight: 120 }}>
        <span className="spin" />
      </div>
    );
  }
  if (error || !data) return null;

  const campaign = data as unknown as Campaign;

  // Filter by creator if specified
  if (filterCreator && campaign.creator.toLowerCase() !== filterCreator.toLowerCase()) {
    return null;
  }

  return <CampaignCard campaign={campaign} />;
}
