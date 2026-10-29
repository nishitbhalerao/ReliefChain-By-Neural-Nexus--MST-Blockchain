"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";
import { IconRelief } from "./Icons";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <IconRelief size="1.3em" style={{ color: "var(--accent)" }} />
          ReliefChain
        </Link>
        <div className="nav-links">
          <Link href="/campaigns" className={`nav-link ${pathname.startsWith("/campaigns") ? "active" : ""}`}>
            Campaigns
          </Link>
          <Link href="/dashboard" className={`nav-link ${pathname.startsWith("/dashboard") ? "active" : ""}`}>
            Dashboard
          </Link>
        </div>
        <div className="nav-right">
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
