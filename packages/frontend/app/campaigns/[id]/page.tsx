"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import Link from "next/link";
import {
  useCampaign,
  useCampaignTotals,
  useProposalCount,
  useReliefChainContract,
  useReliefChainWrite,
} from "@/hooks/useReliefChain";
import {
  Campaign,
  SpendingProposal,
  formatMST,
  txLink,
  addrLink,
  shortAddress,
  proposalStatusLabel,
  proposalStatusBadge,
} from "@/lib/reliefchain";
import { TxStatus } from "@/components/TxStatus";
import { ProposalList } from "@/components/ProposalList";
import { DonateModal } from "@/components/DonateModal";
import { ProposeSpendingModal } from "@/components/ProposeSpendingModal";
import { RecordDistributionModal } from "@/components/RecordDistributionModal";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const campaignId = BigInt(id ?? "0");
  const { address: walletAddress, isConnected } = useAccount();
  const entry = useReliefChainContract();

  const { data: rawCampaign, isLoading, refetch: refetchCampaign } = useCampaign(campaignId);
  const { data: totalsRaw, refetch: refetchTotals } = useCampaignTotals(campaignId);

  const [showDonate, setShowDonate] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);

  const campaign = rawCampaign as unknown as Campaign | undefined;
  const [totalDonated, totalPaidOut, balance] = (totalsRaw as [bigint, bigint, bigint] | undefined) ?? [
    campaign?.totalDonated ?? 0n,
    campaign?.totalPaidOut ?? 0n,
    (campaign?.totalDonated ?? 0n) - (campaign?.totalPaidOut ?? 0n),
  ];

  const refresh = () => { refetchCampaign(); refetchTotals(); };

  if (isLoading) {
    return (
      <div className="page-wrap" style={{ paddingTop: "3rem" }}>
        <span className="spin" /> Loading campaign…
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="page-wrap" style={{ paddingTop: "3rem" }}>
        <div className="alert alert-red">Campaign #{id} not found or not deployed on this network.</div>
        <Link href="/campaigns" className="btn mt-2">← Back to campaigns</Link>
      </div>
    );
  }

  const isActive = campaign.status === 0;
  const pct = campaign.targetAmount > 0n
    ? Math.min(100, Number((totalDonated * 100n) / campaign.targetAmount))
    : 0;

  return (
    <div className="page-wrap" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* ── Breadcrumb ── */}
      <p className="text-sm muted mb-2">
        <Link href="/campaigns" style={{ color: "var(--ink-soft)" }}>Campaigns</Link>
        {" / "}
        {campaign.name}
      </p>

      {/* ── Header ── */}
      <div className="section-header">
        <div>
          <div className="flex flex-wrap mb-1">
            <span className={`badge ${isActive ? "badge-green" : "badge-gray"}`}>
              {isActive ? "Active" : "Closed"}
            </span>
            <span className="badge badge-blue" style={{ marginLeft: "0.5rem" }}>
              {campaign.disasterCategory}
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{campaign.name}</h1>
          <p className="muted text-sm mt-1">📍 {campaign.affectedRegion}</p>
        </div>
        <div className="flex flex-wrap">
          {isActive && isConnected && (
            <>
              <button className="btn btn-primary" onClick={() => setShowDonate(true)}>
                💰 Donate
              </button>
              <button className="btn" onClick={() => setShowPropose(true)}>
                📋 Propose Spending
              </button>
              <button className="btn" onClick={() => setShowDistribution(true)}>
                📦 Record Distribution
              </button>
            </>
          )}
          {!isConnected && (
            <p className="muted text-sm">Connect wallet to donate or propose spending.</p>
          )}
        </div>
      </div>

      {/* ── Accounting stats ── */}
      <div className="stats-grid mt-2 mb-3">
        <div className="stat-card">
          <div className="stat-label">Total Donated</div>
          <div className="stat-value">{formatMST(totalDonated)}</div>
          <div className="stat-unit">MST (on-chain)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Target</div>
          <div className="stat-value">{formatMST(campaign.targetAmount)}</div>
          <div className="stat-unit">MST</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid Out</div>
          <div className="stat-value">{formatMST(totalPaidOut)}</div>
          <div className="stat-unit">MST (executed)</div>
        </div>
        <div className="stat-card" style={{ borderColor: balance > 0n ? "var(--accent)" : undefined }}>
          <div className="stat-label">Contract Balance</div>
          <div className="stat-value" style={{ color: "var(--accent)" }}>{formatMST(balance)}</div>
          <div className="stat-unit">MST held by contract</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card mb-3">
        <div className="flex mb-2">
          <span className="text-sm">Fundraising Progress</span>
          <span className="text-sm muted" style={{ marginLeft: "auto" }}>
            {formatMST(totalDonated)} / {formatMST(campaign.targetAmount)} MST ({pct.toFixed(1)}%)
          </span>
        </div>
        <div className="progress-wrap">
          <div className={`progress-fill ${pct >= 100 ? "full" : ""}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* ── Description ── */}
      <div className="card mb-3">
        <h2 className="font-bold mb-2">About this Campaign</h2>
        <p className="text-sm">{campaign.description || "No description provided."}</p>
        <hr className="divider" />
        <div className="flex flex-wrap" style={{ gap: "1.5rem" }}>
          <div>
            <span className="text-xs muted">Created by</span><br />
            <a href={addrLink(campaign.creator)} target="_blank" rel="noopener noreferrer" className="hash-link">
              {shortAddress(campaign.creator)}
            </a>
          </div>
          <div>
            <span className="text-xs muted">Campaign ID</span><br />
            <span className="mono text-sm">#{campaign.id.toString()}</span>
          </div>
          <div>
            <span className="text-xs muted">Created</span><br />
            <span className="text-sm">
              {new Date(Number(campaign.createdAt) * 1000).toLocaleDateString()}
            </span>
          </div>
          {entry && (
            <div>
              <span className="text-xs muted">Contract</span><br />
              <a href={addrLink(entry.address)} target="_blank" rel="noopener noreferrer" className="hash-link">
                {shortAddress(entry.address)} ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Spending proposals ── */}
      <ProposalList campaignId={campaignId} onRefresh={refresh} />

      {/* ── Modals ── */}
      {showDonate && (
        <DonateModal
          campaignId={campaignId}
          campaignName={campaign.name}
          onClose={() => setShowDonate(false)}
          onSuccess={refresh}
        />
      )}
      {showPropose && (
        <ProposeSpendingModal
          campaignId={campaignId}
          maxAmount={balance}
          onClose={() => setShowPropose(false)}
          onSuccess={refresh}
        />
      )}
      {showDistribution && (
        <RecordDistributionModal
          campaignId={campaignId}
          onClose={() => setShowDistribution(false)}
        />
      )}
    </div>
  );
}
