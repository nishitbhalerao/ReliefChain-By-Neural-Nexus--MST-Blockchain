"use client";

import { useState } from "react";
import { useReliefChainWrite } from "@/hooks/useReliefChain";
import { TxStatus } from "./TxStatus";

interface Props {
  campaignId: bigint;
  onClose: () => void;
}

export function RecordDistributionModal({ campaignId, onClose }: Props) {
  const { write, txHash, isPending, isConfirming, isConfirmed, error, reset } = useReliefChainWrite();
  const [form, setForm] = useState({
    aidCategory: "",
    quantity: "",
    generalizedLocation: "",
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

    if (!form.aidCategory.trim()) return setValidationError("Aid category is required.");
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      return setValidationError("Quantity must be a positive integer.");
    if (!form.generalizedLocation.trim()) return setValidationError("Location is required.");

    try {
      write("recordDistribution", [
        campaignId,
        form.aidCategory.trim(),
        BigInt(Math.floor(Number(form.quantity))),
        form.generalizedLocation.trim(),
        form.evidenceRef.trim(),
      ]);
    } catch (err: any) {
      setValidationError(err.message ?? "Failed to submit.");
    }
  }

  if (isConfirmed) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">✅ Distribution Recorded!</div>
          <TxStatus txHash={txHash} isConfirmed={isConfirmed} />
          <p className="text-sm muted mb-2">
            The aid distribution event has been recorded on-chain.
            Note: this is a record of a claimed delivery, not independently verified physical delivery.
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
        <div className="modal-title">Record Aid Distribution</div>
        <p className="text-sm muted mb-2">
          Records a claimed distribution event on-chain. Does not affect campaign financials.
          Requires RECORDER_ROLE.
        </p>

        <TxStatus txHash={txHash} isPending={isPending} isConfirming={isConfirming} error={error} onDismiss={reset} />
        {validationError && <div className="alert alert-red">{validationError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Aid Category *</label>
              <input
                value={form.aidCategory}
                onChange={(e) => set("aidCategory", e.target.value)}
                placeholder="e.g. Food, Medicine, Shelter"
                disabled={isPending || isConfirming}
              />
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="e.g. 500"
                disabled={isPending || isConfirming}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Generalized Location * (no precise addresses)</label>
            <input
              value={form.generalizedLocation}
              onChange={(e) => set("generalizedLocation", e.target.value)}
              placeholder="e.g. Ernakulam District, Kerala"
              disabled={isPending || isConfirming}
            />
          </div>
          <div className="form-group">
            <label>Evidence Reference (optional)</label>
            <input
              value={form.evidenceRef}
              onChange={(e) => set("evidenceRef", e.target.value)}
              placeholder="ipfs://… or https://…"
              disabled={isPending || isConfirming}
            />
          </div>

          <div className="alert alert-blue" style={{ marginBottom: "1rem" }}>
            ℹ️ This records a claimed delivery. It does not constitute independently verified
            physical aid distribution.
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={isPending || isConfirming}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending || isConfirming}>
              {isPending || isConfirming ? <><span className="spin" /> Recording…</> : "Record Distribution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
