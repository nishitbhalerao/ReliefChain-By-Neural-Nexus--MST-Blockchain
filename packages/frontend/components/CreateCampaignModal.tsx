"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useRouter } from "next/navigation";
import { useReliefChainWrite } from "@/hooks/useReliefChain";
import { TxStatus } from "./TxStatus";
import { DISASTER_CATEGORIES } from "@/lib/reliefchain";

interface Props {
  onClose: () => void;
}

export function CreateCampaignModal({ onClose }: Props) {
  const router = useRouter();
  const { write, txHash, isPending, isConfirming, isConfirmed, error, reset } = useReliefChainWrite();

  const [form, setForm] = useState({
    name: "",
    description: "",
    disasterCategory: "Flood",
    affectedRegion: "",
    targetAmount: "",
  });
  const [validationError, setValidationError] = useState("");

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setValidationError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!form.name.trim())            return setValidationError("Campaign name is required.");
    if (!form.affectedRegion.trim())  return setValidationError("Affected region is required.");
    if (!form.targetAmount || isNaN(Number(form.targetAmount)) || Number(form.targetAmount) <= 0)
      return setValidationError("Target amount must be a positive number.");

    try {
      const targetWei = parseEther(form.targetAmount);
      write("createCampaign", [
        form.name.trim(),
        form.description.trim(),
        form.disasterCategory,
        form.affectedRegion.trim(),
        targetWei,
      ]);
    } catch (err: any) {
      setValidationError(err.message ?? "Failed to submit transaction.");
    }
  }

  // After confirmed, close and navigate to campaigns list
  if (isConfirmed) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">✅ Campaign Created!</div>
          <TxStatus txHash={txHash} isConfirmed={isConfirmed} />
          <p className="text-sm muted mb-2">
            Your campaign has been created on MST Testnet. It will appear in the campaign list.
          </p>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={() => { onClose(); router.refresh(); }}>
              View Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Create Relief Campaign</div>

        <TxStatus txHash={txHash} isPending={isPending} isConfirming={isConfirming} error={error} onDismiss={reset} />
        {validationError && <div className="alert alert-red">{validationError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Campaign Name *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Kerala Flood Relief 2026"
              disabled={isPending || isConfirming}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the disaster situation and how funds will be used…"
              disabled={isPending || isConfirming}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Disaster Category *</label>
              <select
                value={form.disasterCategory}
                onChange={(e) => set("disasterCategory", e.target.value)}
                disabled={isPending || isConfirming}
              >
                {DISASTER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Affected Region *</label>
              <input
                value={form.affectedRegion}
                onChange={(e) => set("affectedRegion", e.target.value)}
                placeholder="e.g. Kerala, India"
                disabled={isPending || isConfirming}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Fundraising Target (MST) *</label>
            <input
              type="number"
              step="any"
              min="0"
              value={form.targetAmount}
              onChange={(e) => set("targetAmount", e.target.value)}
              placeholder="e.g. 100"
              disabled={isPending || isConfirming}
            />
          </div>

          <div className="alert alert-yellow" style={{ marginBottom: "1rem" }}>
            ⚠️ Demo only — uses MST Testnet tokens. Not real charitable donations.
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={isPending || isConfirming}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending || isConfirming}>
              {isPending || isConfirming ? <><span className="spin" /> Submitting…</> : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
