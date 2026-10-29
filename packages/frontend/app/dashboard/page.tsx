"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import Link from "next/link";
import { useState } from "react";
import { useReliefChainContract, useCampaignCount, useProposalCount } from "@/hooks/useReliefChain";
import { CampaignLoader } from "@/components/CampaignLoader";
import { CreateCampaignModal } from "@/components/CreateCampaignModal";
import { DashboardProposalsList } from "@/components/DashboardProposalsList";
import { addrLink, formatMST } from "@/lib/reliefchain";
import { ROLE_HASHES } from "@/lib/roles";
import { WalletButton } from "@/components/WalletButton";
import { IconKey, IconCheckCircle, IconWarning } from "@/components/Icons";

const APPROVER_ROLE     = ROLE_HASHES.APPROVER_ROLE;
const ORGANIZATION_ROLE = ROLE_HASHES.ORGANIZATION_ROLE;
const RECORDER_ROLE     = ROLE_HASHES.RECORDER_ROLE;
const ADMIN_ROLE        = ROLE_HASHES.DEFAULT_ADMIN_ROLE;

export default function DashboardPage() {
  const { address, isConnected, chainId } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const entry = useReliefChainContract();
  const { data: campaignCount } = useCampaignCount();
  const { data: proposalCount } = useProposalCount();
  const [showCreate, setShowCreate] = useState(false);

  const { data: rawIsAdmin }    = useReadContract({ address: entry?.address, abi: entry?.abi, functionName: "hasRole", args: address ? [ADMIN_ROLE,        address] : undefined, query: { enabled: Boolean(entry && address) } });
  const { data: rawIsOrg }      = useReadContract({ address: entry?.address, abi: entry?.abi, functionName: "hasRole", args: address ? [ORGANIZATION_ROLE, address] : undefined, query: { enabled: Boolean(entry && address) } });
  const { data: rawIsApprover } = useReadContract({ address: entry?.address, abi: entry?.abi, functionName: "hasRole", args: address ? [APPROVER_ROLE,     address] : undefined, query: { enabled: Boolean(entry && address) } });
  const { data: rawIsRecorder } = useReadContract({ address: entry?.address, abi: entry?.abi, functionName: "hasRole", args: address ? [RECORDER_ROLE,     address] : undefined, query: { enabled: Boolean(entry && address) } });

  const isAdmin    = Boolean(rawIsAdmin);
  const isOrg      = Boolean(rawIsOrg);
  const isApprover = Boolean(rawIsApprover);
  const isRecorder = Boolean(rawIsRecorder);

  if (!isConnected) {
    return (
      <div className="page-wrap" style={{ paddingTop: "3rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem", color: "var(--accent)", display: "flex", justifyContent: "center" }}>
            <IconKey size="3rem" />
          </div>
          <h2 className="font-bold mb-2">Connect BridgeKey Wallet</h2>
          <p className="muted text-sm mb-3">
            Connect your BridgeKey wallet to view your dashboard, create campaigns, and manage funds.
            <br />
            Don&apos;t have BridgeKey?{" "}
            <a
              href="https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg"
              target="_blank"
              rel="noopener noreferrer"
              className="hash-link"
            >
              Install the Chrome extension ↗
            </a>
          </p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
      <div className="section-header">
        <h1 className="section-title">My Dashboard</h1>
        {isOrg && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Campaign
          </button>
        )}
      </div>

      {/* Wallet info */}
      <div className="card mb-3">
        <h2 className="font-bold mb-2">Wallet</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Address</div>
            <div style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>
              {address && (
                <a href={addrLink(address)} target="_blank" rel="noopener noreferrer" className="hash-link">
                  {address}
                </a>
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Balance</div>
            <div className="stat-value">
              {balanceData ? formatMST(balanceData.value, 4) : "—"}
            </div>
            <div className="stat-unit">MST Testnet</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Network</div>
            <div className="stat-value" style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {chainId === 91562037
                ? <><IconCheckCircle size="1em" style={{ color: "var(--green)" }} /> MST Testnet</>
                : <><IconWarning size="1em" style={{ color: "var(--yellow)" }} /> Wrong Network</>
              }
            </div>
            <div className="stat-unit">Chain ID: {chainId}</div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap">
          <span className="text-sm muted" style={{ marginRight: "0.5rem" }}>Your roles:</span>
          {isAdmin    && <span className="badge badge-red"    style={{ marginRight: "0.35rem" }}>Admin</span>}
          {isOrg      && <span className="badge badge-blue"   style={{ marginRight: "0.35rem" }}>Organization</span>}
          {isApprover && <span className="badge badge-green"  style={{ marginRight: "0.35rem" }}>Approver</span>}
          {isRecorder && <span className="badge badge-yellow" style={{ marginRight: "0.35rem" }}>Recorder</span>}
          {!isAdmin && !isOrg && !isApprover && !isRecorder && (
            <span className="badge badge-gray">Donor only</span>
          )}
        </div>

        {!isOrg && (
          <div className="alert alert-yellow mt-2">
            Your address does not have ORGANIZATION_ROLE. You can donate to campaigns but cannot
            create campaigns or submit spending proposals. The contract deployer (admin) must
            grant you the role.
          </div>
        )}
      </div>

      {/* Contract info */}
      <div className="card mb-3">
        <h2 className="font-bold mb-2">Smart Contract</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Campaigns</div>
            <div className="stat-value">{campaignCount?.toString() ?? "—"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Proposals</div>
            <div className="stat-value">{proposalCount?.toString() ?? "—"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Contract Address</div>
            <div style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
              {entry ? (
                <a href={addrLink(entry.address)} target="_blank" rel="noopener noreferrer" className="hash-link">
                  {entry.address} ↗
                </a>
              ) : (
                "Not deployed on this network"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My Campaigns (org only) */}
      {isOrg && address && (
        <>
          <div className="section-header mt-3">
            <h2 className="section-title">My Campaigns</h2>
          </div>
          <CampaignLoader filterCreator={address as `0x${string}`} />
        </>
      )}

      {/* Pending proposals for approvers */}
      {isApprover && (
        <>
          <div className="section-header mt-3">
            <h2 className="section-title">Proposals Awaiting Approval</h2>
          </div>
          <DashboardProposalsList filterStatus={0} />
        </>
      )}

      {/* All proposals */}
      <div className="section-header mt-3">
        <h2 className="section-title">All Spending Proposals</h2>
        <Link href="/campaigns" className="btn btn-sm">View Campaigns →</Link>
      </div>
      <DashboardProposalsList />

      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
