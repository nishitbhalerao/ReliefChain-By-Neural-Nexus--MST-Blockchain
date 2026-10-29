"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useCampaignCount, useReliefChainContract } from "@/hooks/useReliefChain";
import { CampaignLoader } from "@/components/CampaignLoader";
import { addrLink } from "@/lib/reliefchain";
import {
  IconOrganization,
  IconDonate,
  IconClipboard,
  IconCheckCircle,
  IconRocket,
  IconKey,
  IconSearch,
  IconPackage,
  IconLock,
  IconChart,
  IconBlock,
  IconWarning,
} from "@/components/Icons";

export default function Home() {
  const { isConnected } = useAccount();
  const { data: campaignCount } = useCampaignCount();
  const entry = useReliefChainContract();

  const steps = [
    {
      icon: <IconOrganization size="1.75rem" />,
      title: "1. Organization Creates Campaign",
      desc: "Verified relief organizations create campaigns on-chain with a fundraising target and category.",
    },
    {
      icon: <IconDonate size="1.75rem" />,
      title: "2. Donors Contribute",
      desc: "Anyone can donate MST testnet tokens. Funds are held securely in the smart contract, not a bank account.",
    },
    {
      icon: <IconClipboard size="1.75rem" />,
      title: "3. Spending Proposed",
      desc: "The organization submits a spending proposal with recipient, amount, purpose, and evidence reference.",
    },
    {
      icon: <IconCheckCircle size="1.75rem" />,
      title: "4. Independent Approval",
      desc: "A separate authorized approver reviews and approves or rejects proposals — enforced on-chain.",
    },
    {
      icon: <IconRocket size="1.75rem" />,
      title: "5. Payout Executed",
      desc: "Approved proposals are executed, transferring funds to the recipient. Every step has an on-chain record.",
    },
  ];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="page-wrap">
          <h1 className="hero-tagline">
            Every Donation<br />Should Tell a Story.
          </h1>
          <p className="hero-sub">
            ReliefChain is a blockchain-powered disaster-relief platform where every
            rupee is tracked, every approval is transparent, and every payout is
            verifiable on-chain. Connect your BridgeKey wallet to get started.
          </p>
          <div className="hero-actions">
            <Link href="/campaigns" className="btn btn-primary">
              Explore Campaigns →
            </Link>
            {isConnected && (
              <Link href="/dashboard" className="btn">
                My Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="page-wrap" style={{ paddingBottom: "3rem" }}>
        <div className="stats-grid mt-3">
          <div className="stat-card">
            <div className="stat-label">Active Campaigns</div>
            <div className="stat-value">{campaignCount?.toString() ?? "—"}</div>
            <div className="stat-unit">on MST Testnet</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Smart Contract</div>
            <div className="stat-value" style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>
              {entry ? (
                <a href={addrLink(entry.address)} target="_blank" rel="noopener noreferrer" className="hash-link">
                  {entry.address.slice(0, 10)}…{entry.address.slice(-6)}
                </a>
              ) : "—"}
            </div>
            <div className="stat-unit">verified on MSTScan</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Network</div>
            <div className="stat-value">MST</div>
            <div className="stat-unit">Testnet · Chain 91562037</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Transparency</div>
            <div className="stat-value">100%</div>
            <div className="stat-unit">on-chain accounting</div>
          </div>
        </div>

        <hr className="divider" />

        {/* ── How it works ── */}
        <div className="section-header mt-3">
          <h2 className="section-title">How ReliefChain Works</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {steps.map((step) => (
            <div key={step.title} className="card">
              <div style={{ marginBottom: "0.5rem", color: "var(--accent)" }}>{step.icon}</div>
              <div className="font-bold mb-1">{step.title}</div>
              <p className="text-sm muted">{step.desc}</p>
            </div>
          ))}
        </div>

        <hr className="divider" />

        {/* ── Active campaigns preview ── */}
        <div className="section-header mt-3">
          <h2 className="section-title">Recent Campaigns</h2>
          <Link href="/campaigns" className="btn btn-sm">View all →</Link>
        </div>
        <CampaignLoader limit={3} />

        {/* ── BridgeKey callout ── */}
        <div className="card mt-3" style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div className="font-bold mb-1" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <IconKey size="1.1em" style={{ color: "var(--accent)" }} />
              Need a wallet?
            </div>
            <p className="text-sm muted">
              ReliefChain uses <strong>BridgeKey</strong> — the native MST Blockchain wallet.
              Install the Chrome extension, add MST Testnet, and get free testnet tokens from the faucet.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a
              href="https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Install BridgeKey ↗
            </a>
            <a
              href="https://faucet.masterstroke.academy"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Get Test Tokens ↗
            </a>
          </div>
        </div>

        <hr className="divider" />
        <div className="card mt-3">
          <h2 className="section-title mb-2">Transparency &amp; Verification</h2>
          <p className="text-sm muted mb-2">
            All financial data — donations, spending proposals, approvals, and payouts — is stored
            directly in the smart contract on MST Testnet. You can independently verify every
            transaction:
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li className="text-sm" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconSearch size="1em" style={{ flexShrink: 0, color: "var(--accent)" }} />
              <a href={entry ? addrLink(entry.address) : "https://testnet.mstscan.com"} target="_blank" rel="noopener noreferrer" className="hash-link">
                View ReliefChain contract on MSTScan ↗
              </a>
            </li>
            <li className="text-sm" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconPackage size="1em" style={{ flexShrink: 0, color: "var(--accent)" }} />
              Every campaign has a unique on-chain ID
            </li>
            <li className="text-sm" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconLock size="1em" style={{ flexShrink: 0, color: "var(--accent)" }} />
              Spending requires independent APPROVER_ROLE approval
            </li>
            <li className="text-sm" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconChart size="1em" style={{ flexShrink: 0, color: "var(--accent)" }} />
              Balance = Total Donated − Total Paid Out (contract-enforced)
            </li>
            <li className="text-sm" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconBlock size="1em" style={{ flexShrink: 0, color: "var(--accent)" }} />
              Unauthorized withdrawals are blocked by the smart contract, not just the UI
            </li>
          </ul>
        </div>

        {/* ── Footer ── */}
        <footer style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--line)", textAlign: "center" }}>
          <p className="text-sm muted">
            ReliefChain · MST Blockchain Buildathon 2.0 · Round 2
          </p>
          <p className="text-xs muted mt-1" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
            <IconWarning size="0.9em" style={{ flexShrink: 0 }} />
            This is a testnet demonstration. Demo transactions use MST Testnet tokens —
            they are <strong>not</strong> real-money charitable donations.
          </p>
          {entry && (
            <p className="text-xs muted mt-1">
              Contract:{" "}
              <a href={addrLink(entry.address)} target="_blank" rel="noopener noreferrer" className="hash-link">
                {entry.address}
              </a>
            </p>
          )}
        </footer>
      </section>
    </div>
  );
}
