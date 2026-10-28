"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          ⛑️ ReliefChain
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
