"use client";

import { txLink } from "@/lib/reliefchain";

interface Props {
  txHash?: `0x${string}`;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  error?: Error | null;
  onDismiss?: () => void;
}

export function TxStatus({ txHash, isPending, isConfirming, isConfirmed, error, onDismiss }: Props) {
  if (!isPending && !isConfirming && !isConfirmed && !error) return null;

  return (
    <div
      className={`alert ${
        error
          ? "alert-red"
          : isConfirmed
          ? "alert-green"
          : "alert-yellow"
      }`}
      style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}
    >
      <span style={{ flex: 1 }}>
        {isPending && (
          <>
            <span className="spin" /> Awaiting wallet confirmation…
          </>
        )}
        {isConfirming && (
          <>
            <span className="spin" /> Transaction submitted. Waiting for confirmation…{" "}
            {txHash && (
              <a href={txLink(txHash)} target="_blank" rel="noopener noreferrer" className="hash-link">
                {txHash.slice(0, 10)}…
              </a>
            )}
          </>
        )}
        {isConfirmed && (
          <>
            ✅ Transaction confirmed!{" "}
            {txHash && (
              <a href={txLink(txHash)} target="_blank" rel="noopener noreferrer" className="hash-link">
                View on MSTScan ↗
              </a>
            )}
          </>
        )}
        {error && <>❌ {error.message?.slice(0, 200)}</>}
      </span>
      {onDismiss && (
        <button
          className="btn btn-sm"
          style={{ padding: "0.15rem 0.5rem", minWidth: "unset" }}
          onClick={onDismiss}
        >
          ×
        </button>
      )}
    </div>
  );
}
