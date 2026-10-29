"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import { mstTestnet } from "@/lib/chains";
import { shortAddress, formatMST } from "@/lib/reliefchain";
import { IconKey, IconWarning } from "./Icons";

const BRIDGEKEY_CHROME =
  "https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg";

export function WalletButton() {
  // mounted gate — suppresses any SSR/client mismatch entirely.
  // Nothing wallet-related renders until the component is on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!connectError) return;
    const msg = connectError.message ?? "";
    if (msg.includes("rejected") || msg.includes("denied")) {
      setErrorMsg("Connection rejected in wallet.");
    } else if (msg.includes("pending")) {
      setErrorMsg("A connection request is already pending — check your wallet.");
    } else {
      setErrorMsg(msg.slice(0, 100));
    }
    const t = setTimeout(() => setErrorMsg(""), 6000);
    return () => clearTimeout(t);
  }, [connectError]);

  // ── SSR placeholder — identical on server and first client render ─────────
  if (!mounted) {
    return <span style={{ width: 140, height: 32, display: "inline-block" }} />;
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {isConnected && chainId !== mstTestnet.id && (
          <button
            className="btn btn-sm"
            style={{ borderColor: "var(--red)", color: "var(--red)", display: "flex", alignItems: "center", gap: "0.3rem" }}
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: mstTestnet.id })}
          >
            {isSwitching ? <span className="spin" /> : <IconWarning size="0.95em" />}
            Switch to MST Testnet
          </button>
        )}
        <span className="addr" title={address} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <IconKey size="0.95em" />
          {shortAddress(address)}
          {balance && chainId === mstTestnet.id && (
            <span className="muted" style={{ marginLeft: "0.4rem" }}>
              {formatMST(balance.value, 3)} MST
            </span>
          )}
        </span>
        <button className="btn btn-sm" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  // ── No wallet extension ───────────────────────────────────────────────────
  const eth = (window as any).ethereum;
  const hasProvider = !!eth;
  if (!hasProvider) {
    return (
      <a
        href={BRIDGEKEY_CHROME}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary btn-sm"
        style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
      >
        <IconKey size="0.95em" /> Install BridgeKey
      </a>
    );
  }

  // Detect whether BridgeKey is actually present (vs MetaMask only).
  // BridgeKey sets isBridgeKey=true or announces via EIP-6963 rdns.
  const providers: any[] = eth.providers ?? [];
  const hasBridgeKey =
    eth.isBridgeKey ||
    providers.some(
      (p: any) => p.isBridgeKey || p.info?.rdns === "com.mstblockchain.bridgekey"
    );
  const hasMetaMaskOnly = !hasBridgeKey && (eth.isMetaMask || providers.some((p: any) => p.isMetaMask));

  // ── Wallet present — user must explicitly click connect ───────────────────
  const injectedConnector =
    connectors.find((c) => c.type === "injected") ?? connectors[0];

  function handleConnect() {
    setErrorMsg("");
    if (!injectedConnector) return;
    connect({ connector: injectedConnector });
  }

  // MetaMask detected but BridgeKey is not installed — nudge user to install.
  if (hasMetaMaskOnly) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
        <a
          href={BRIDGEKEY_CHROME}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
        >
          <IconKey size="0.95em" /> Install BridgeKey
        </a>
        <span style={{ fontSize: "0.7rem", color: "var(--yellow)", maxWidth: 220, textAlign: "right" }}>
          MetaMask detected — this app uses BridgeKey wallet.
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <button
        className="btn btn-primary btn-sm"
        disabled={isPending}
        onClick={handleConnect}
        style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
      >
        {isPending
          ? <><span className="spin" /> Connecting…</>
          : <><IconKey size="0.95em" /> Connect BridgeKey</>
        }
      </button>
      {errorMsg && (
        <span style={{ fontSize: "0.73rem", color: "var(--red)", marginTop: "0.25rem", maxWidth: 220, textAlign: "right" }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}
