"use client";

import Link from "next/link";
import { Campaign, CampaignStatus, formatMST } from "@/lib/reliefchain";
import { useCampaignTotals } from "@/hooks/useReliefChain";
import { IconPin } from "./Icons";

interface Props {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: Props) {
  const { data: totals } = useCampaignTotals(campaign.id);
  const [totalDonated, totalPaidOut, balance] = (totals as [bigint, bigint, bigint] | undefined) ?? [
    campaign.totalDonated,
    campaign.totalPaidOut,
    campaign.totalDonated - campaign.totalPaidOut,
  ];

  const pct =
    campaign.targetAmount > 0n
      ? Math.min(100, Number((totalDonated * 100n) / campaign.targetAmount))
      : 0;

  const isClosed = campaign.status === 1;

  return (
    <div className="campaign-card">
      <div className="campaign-card-header">
        <div>
          <div className="campaign-card-title">{campaign.name}</div>
          <div className="campaign-card-meta mt-1" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <IconPin size="0.85em" style={{ flexShrink: 0 }} />
            {campaign.affectedRegion}
          </div>
        </div>
        <span className={`badge ${isClosed ? "badge-gray" : "badge-green"}`}>
          {isClosed ? "Closed" : "Active"}
        </span>
      </div>

      <div>
        <span className="badge badge-blue" style={{ marginBottom: "0.5rem" }}>
          {campaign.disasterCategory}
        </span>
        <p className="text-sm muted" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {campaign.description || "No description provided."}
        </p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex mb-1">
          <span className="text-xs muted">Progress</span>
          <span className="text-xs muted" style={{ marginLeft: "auto" }}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="progress-wrap">
          <div
            className={`progress-fill ${pct >= 100 ? "full" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="campaign-card-stats">
        <div className="campaign-card-stat">
          <div className="label">Donated</div>
          <div className="value">{formatMST(totalDonated)} <span className="muted text-xs">MST</span></div>
        </div>
        <div className="campaign-card-stat">
          <div className="label">Target</div>
          <div className="value">{formatMST(campaign.targetAmount)} <span className="muted text-xs">MST</span></div>
        </div>
        <div className="campaign-card-stat">
          <div className="label">Paid Out</div>
          <div className="value">{formatMST(totalPaidOut)} <span className="muted text-xs">MST</span></div>
        </div>
        <div className="campaign-card-stat">
          <div className="label">Balance</div>
          <div className="value">{formatMST(balance)} <span className="muted text-xs">MST</span></div>
        </div>
      </div>

      <Link href={`/campaigns/${campaign.id.toString()}`} className="btn btn-primary w-full" style={{ justifyContent: "center" }}>
        View Campaign →
      </Link>
    </div>
  );
}
