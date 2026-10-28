"use client";

import { useState } from "react";
import { parseEther, isAddress } from "viem";
import { useReliefChainWrite } from "@/hooks/useReliefChain";
import { TxStatus } from "./TxStatus";
import { formatMST } from "@/lib/reliefchain";

interface Props {
  campaignId: bigint;
  maxAmount: bigint;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProposeSpendingModal({ campaignId, maxAmount, onClose, onSuccess }: Props) {
  const { write, txHash, isPending, isConfirming, isConfirmed, error, reset } = useReliefChainWrite();
  const [form, setForm] = useState({
    recipient: "",
    amount: "",
    purpose: "",
    evidenceRef: "",
  });
  const [validationError, setValidationError] = useState("");

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setValidationError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!form.recipient || !isAddress(form.recipient)) {
      return setValidationError("Please enter a valid recipient address (0x…).");
    }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      return setValidationError("Please enter a positive amount.");
    }
    const amountWei = parseEther(form.amount);
    if (amountWei > maxAmount) {
      return setValidationError(
        `Amount exceeds available campaign balance (${formatMST(maxAmount)} MST).`
      );
    }
    if (!form.purpose.trim()) {
      return setValidationError("Purpose is required.");
    }

    try {
      write("proposeSpending", [
        campaignId,
        form.recipient as `0x${string}`,
        amountWei,
        form.purpose.trim(),
        form.evidenceRef.trim(),
      ]);
    } catch (err: any) {
      setValidationError(err.message ?? "Failed to submit.");
    }
  }

  if (isConfirmed) {
    onSuccess();
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">✅ Proposal Submitted!</div>
          <TxStatus txHash={txHash} isConfirmed={isConfirmed} />
          <p className="text-sm muted mb-2">
            Your spending proposal is now pending approval by an authorized approver.
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
        <div className="modal-title">Propose Spending</div>
        <p className="text-sm muted mb-2">
          Available balance: <strong>{formatMST(maxAmount)} MST</strong>
        </p>

        <TxStatus txHash={txHash} isPending={isPending} isConfirming={isConfirming} error={error} onDismiss={reset} />
        {validationError && <div className="alert alert-red">{validationError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Recipient Address *</label>
            <input
              value={form.recipient}
              onChange={(e) => set("recipient", e.target.value)}
              placeholder="0x…"
              disabled={isPending || isConfirming}
            />
          </div>
          <div className="form-group">
            <label>Amount (MST) *</label>
            <input
              type="number"
              step="any"
              min="0"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder={`Max: ${formatMST(maxAmount)}`}
              disabled={isPending || isConfirming}
            />
          </div>
          <div className="form-group">
            <label>Purpose *</label>
            <textarea
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder="e.g. Purchase 500 food kits for 500 families in Ernakulam district"
              disabled={isPending || isConfirming}
            />
          </div>
          <div className="form-group">
            <label>Evidence Reference (URL / IPFS CID)</label>
            <input
              value={form.evidenceRef}
              onChange={(e) => set("evidenceRef", e.target.value)}
              placeholder="e.g. ipfs://QmXxx… or https://drive.google.com/…"
              disabled={isPending || isConfirming}
            />
            <span className="text-xs muted">
              Off-chain document link or IPFS hash stored on-chain as a reference.
            </span>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={isPending || isConfirming}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending || isConfirming}>
              {isPending || isConfirming ? <><span className="spin" /> Submitting…</> : "Submit Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
