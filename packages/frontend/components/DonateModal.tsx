"use client";

import { useState } from "react";
import { parseEther, formatEther } from "viem";
import { useBalance, useAccount } from "wagmi";
import { useReliefChainWrite } from "@/hooks/useReliefChain";
import { TxStatus } from "./TxStatus";
import { formatMST } from "@/lib/reliefchain";

interface Props {
  campaignId: bigint;
  campaignName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DonateModal({ campaignId, campaignName, onClose, onSuccess }: Props) {
  const { address } = useAccount();
  const { data: walletBalance } = useBalance({ address });
  const { write, txHash, isPending, isConfirming, isConfirmed, error, reset } = useReliefChainWrite();
  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState("");

  function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      return setValidationError("Please enter a positive donation amount.");
    }
    if (walletBalance && parseEther(amount) > walletBalance.value) {
      return setValidationError("Amount exceeds your wallet balance.");
    }

    try {
      write("donate", [campaignId], parseEther(amount));
    } catch (err: any) {
      setValidationError(err.message ?? "Failed to submit transaction.");
    }
  }

  if (isConfirmed) {
    onSuccess();
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">✅ Donation Confirmed!</div>
          <TxStatus txHash={txHash} isConfirmed={isConfirmed} />
          <p className="text-sm muted mb-2">
            Your donation of <strong>{amount} MST</strong> has been confirmed on MST Testnet.
            The campaign balance has been updated.
          </p>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Donate to &quot;{campaignName}&quot;</div>

        <TxStatus txHash={txHash} isPending={isPending} isConfirming={isConfirming} error={error} onDismiss={reset} />
        {validationError && <div className="alert alert-red">{validationError}</div>}

        <form onSubmit={handleDonate}>
          {walletBalance && (
            <p className="text-sm muted mb-2">
              Wallet balance: {formatMST(walletBalance.value, 4)} MST
            </p>
          )}
          <div className="form-group">
            <label>Donation Amount (MST) *</label>
            <input
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setValidationError(""); }}
              placeholder="e.g. 1.5"
              disabled={isPending || isConfirming}
              autoFocus
            />
          </div>

          <div className="alert alert-yellow" style={{ marginBottom: "1rem" }}>
            ⚠️ Demo only — uses MST Testnet tokens. Not real charitable donations.
            Funds are held by the smart contract until an approved spending proposal is executed.
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={isPending || isConfirming}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending || isConfirming || !amount}>
              {isPending || isConfirming ? <><span className="spin" /> Processing…</> : `Donate ${amount || "…"} MST`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
