import type { Metadata } from "next";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { IconWarning } from "@/components/Icons";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReliefChain — Every Donation Should Tell a Story",
  description:
    "Blockchain-powered disaster-relief donation and fund-management platform on MST Blockchain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="testnet-banner" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
            <IconWarning size="0.9em" style={{ flexShrink: 0 }} />
            MST Testnet Demo — transactions use test tokens only, not real funds &nbsp;|&nbsp;
            Wallet: <a href="https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg" target="_blank" rel="noopener noreferrer" style={{ color: "var(--yellow)", fontWeight: 600 }}>BridgeKey ↗</a>
            &nbsp;|&nbsp; Faucet: <a href="https://faucet.masterstroke.academy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--yellow)", fontWeight: 600 }}>Get test MST ↗</a>
          </div>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
