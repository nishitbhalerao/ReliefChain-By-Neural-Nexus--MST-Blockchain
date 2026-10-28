"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { CampaignLoader } from "@/components/CampaignLoader";
import { CreateCampaignModal } from "@/components/CreateCampaignModal";
import { useReliefChainContract } from "@/hooks/useReliefChain";

export default function CampaignsPage() {
  const { isConnected } = useAccount();
  const entry = useReliefChainContract();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="page-wrap" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Relief Campaigns</h1>
          <p className="muted text-sm mt-1">
            All campaigns are on-chain. Balances are read directly from the contract.
          </p>
        </div>
        {isConnected && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Create Campaign
          </button>
        )}
      </div>

      {!entry && (
        <div className="alert alert-yellow mb-2">
          Contract not found on this network. Please connect to MST Testnet.
        </div>
      )}

      <CampaignLoader />

      {showCreate && (
        <CreateCampaignModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
