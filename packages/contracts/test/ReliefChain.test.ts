import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ReliefChain } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { parseEther } from "ethers";

// ─── Role constants ──────────────────────────────────────────────────────────
const ORGANIZATION_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORGANIZATION_ROLE"));
const APPROVER_ROLE     = ethers.keccak256(ethers.toUtf8Bytes("APPROVER_ROLE"));
const RECORDER_ROLE     = ethers.keccak256(ethers.toUtf8Bytes("RECORDER_ROLE"));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TARGET = parseEther("10");
const ONE_ETH = parseEther("1");

async function deployFixture() {
  const [admin, org, approver, donor, donor2, recipient, stranger] =
    await ethers.getSigners();

  const RC = await ethers.getContractFactory("ReliefChain");
  const rc = (await RC.deploy()) as ReliefChain;
  await rc.waitForDeployment();

  // Grant separate org / approver / recorder roles
  await rc.connect(admin).grantRole(ORGANIZATION_ROLE, org.address);
  await rc.connect(admin).grantRole(APPROVER_ROLE,     approver.address);
  await rc.connect(admin).grantRole(RECORDER_ROLE,     approver.address);

  return { rc, admin, org, approver, donor, donor2, recipient, stranger };
}

async function campaignFixture() {
  const base = await deployFixture();
  const { rc, org } = base;
  const tx = await rc
    .connect(org)
    .createCampaign("Flood Relief", "Helping flood victims", "Flood", "Kerala, India", TARGET);
  const receipt = await tx.wait();
  // campaign ID is 1 (first)
  return { ...base, campaignId: 1n };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ReliefChain", () => {
  // ── Campaign creation ──────────────────────────────────────────────────────
  describe("createCampaign()", () => {
    it("authorized org creates a campaign and emits CampaignCreated", async () => {
      const { rc, org } = await deployFixture();
      await expect(
        rc.connect(org).createCampaign("Flood", "Desc", "Flood", "Region", TARGET)
      )
        .to.emit(rc, "CampaignCreated")
        .withArgs(1n, org.address, "Flood", "Flood", "Region", TARGET, anyValue);
    });

    it("increments campaignCount", async () => {
      const { rc, org } = await deployFixture();
      await rc.connect(org).createCampaign("A", "d", "Flood", "R", TARGET);
      await rc.connect(org).createCampaign("B", "d", "Fire",  "R", TARGET);
      expect(await rc.campaignCount()).to.equal(2n);
    });

    it("reverts for unauthorized caller", async () => {
      const { rc, stranger } = await deployFixture();
      await expect(
        rc.connect(stranger).createCampaign("X", "d", "F", "R", TARGET)
      ).to.be.reverted;
    });

    it("reverts on empty name", async () => {
      const { rc, org } = await deployFixture();
      await expect(
        rc.connect(org).createCampaign("", "d", "F", "R", TARGET)
      ).to.be.revertedWithCustomError(rc, "EmptyName");
    });

    it("reverts on zero target", async () => {
      const { rc, org } = await deployFixture();
      await expect(
        rc.connect(org).createCampaign("X", "d", "F", "R", 0n)
      ).to.be.revertedWithCustomError(rc, "ZeroTarget");
    });

    it("stores campaign data correctly", async () => {
      const { rc, org } = await campaignFixture();
      const c = await rc.getCampaign(1n);
      expect(c.name).to.equal("Flood Relief");
      expect(c.creator).to.equal(org.address);
      expect(c.targetAmount).to.equal(TARGET);
      expect(c.status).to.equal(0n); // Active
    });
  });

  // ── Donations ──────────────────────────────────────────────────────────────
  describe("donate()", () => {
    it("accepts a valid donation and emits Donated", async () => {
      const { rc, donor, campaignId } = await campaignFixture();
      await expect(
        rc.connect(donor).donate(campaignId, { value: ONE_ETH })
      )
        .to.emit(rc, "Donated")
        .withArgs(campaignId, donor.address, ONE_ETH, ONE_ETH, anyValue);
    });

    it("increases the campaign balance", async () => {
      const { rc, donor, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      const [, , bal] = await rc.getCampaignTotals(campaignId);
      expect(bal).to.equal(ONE_ETH);
    });

    it("updates totalDonated", async () => {
      const { rc, donor, donor2, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId,  { value: ONE_ETH });
      await rc.connect(donor2).donate(campaignId, { value: parseEther("2") });
      const [total] = await rc.getCampaignTotals(campaignId);
      expect(total).to.equal(parseEther("3"));
    });

    it("sends ETH to the contract", async () => {
      const { rc, donor, campaignId } = await campaignFixture();
      const before = await ethers.provider.getBalance(await rc.getAddress());
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      const after = await ethers.provider.getBalance(await rc.getAddress());
      expect(after - before).to.equal(ONE_ETH);
    });

    it("reverts on zero donation", async () => {
      const { rc, donor, campaignId } = await campaignFixture();
      await expect(
        rc.connect(donor).donate(campaignId, { value: 0n })
      ).to.be.revertedWithCustomError(rc, "ZeroDonation");
    });

    it("reverts on invalid campaign ID", async () => {
      const { rc, donor } = await deployFixture();
      await expect(
        rc.connect(donor).donate(999n, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(rc, "InvalidCampaign");
    });

    it("reverts on donation to a closed campaign", async () => {
      const { rc, org, donor, campaignId } = await campaignFixture();
      await rc.connect(org).closeCampaign(campaignId);
      await expect(
        rc.connect(donor).donate(campaignId, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(rc, "CampaignNotActive");
    });
  });

  // ── Spending proposals ─────────────────────────────────────────────────────
  describe("proposeSpending()", () => {
    it("authorized org can propose spending", async () => {
      const { rc, org, donor, recipient, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await expect(
        rc.connect(org).proposeSpending(campaignId, recipient.address, ONE_ETH, "Food", "ipfs://abc")
      )
        .to.emit(rc, "SpendingProposed")
        .withArgs(1n, campaignId, org.address, recipient.address, ONE_ETH, "Food", "ipfs://abc", anyValue);
    });

    it("reverts for unauthorized caller", async () => {
      const { rc, donor, recipient, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await expect(
        rc.connect(stranger(donor)).proposeSpending(campaignId, recipient.address, ONE_ETH, "Food", "")
      ).to.be.reverted;
    });

    it("reverts when amount exceeds balance", async () => {
      const { rc, org, donor, recipient, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await expect(
        rc.connect(org).proposeSpending(campaignId, recipient.address, parseEther("5"), "Food", "")
      ).to.be.revertedWithCustomError(rc, "InsufficientCampaignBalance");
    });

    it("reverts on zero amount", async () => {
      const { rc, org, donor, recipient, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await expect(
        rc.connect(org).proposeSpending(campaignId, recipient.address, 0n, "Food", "")
      ).to.be.revertedWithCustomError(rc, "ZeroAmount");
    });

    it("reverts on zero recipient address", async () => {
      const { rc, org, donor, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await expect(
        rc.connect(org).proposeSpending(campaignId, ethers.ZeroAddress, ONE_ETH, "Food", "")
      ).to.be.revertedWithCustomError(rc, "RecipientIsZero");
    });

    it("reverts on empty purpose", async () => {
      const { rc, org, donor, recipient, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await expect(
        rc.connect(org).proposeSpending(campaignId, recipient.address, ONE_ETH, "", "")
      ).to.be.revertedWithCustomError(rc, "EmptyPurpose");
    });

    it("reverts proposal on closed campaign", async () => {
      const { rc, org, donor, recipient, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await rc.connect(org).closeCampaign(campaignId);
      await expect(
        rc.connect(org).proposeSpending(campaignId, recipient.address, ONE_ETH, "Food", "")
      ).to.be.revertedWithCustomError(rc, "CampaignNotActive");
    });
  });

  // ── Approve / reject / execute ─────────────────────────────────────────────
  describe("approveSpending() / rejectSpending() / executeSpending()", () => {
    async function withProposal() {
      const base = await campaignFixture();
      const { rc, org, donor, recipient, approver, campaignId } = base;
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await rc.connect(org).proposeSpending(campaignId, recipient.address, ONE_ETH, "Food", "ipfs://x");
      const proposalId = 1n;
      return { ...base, proposalId };
    }

    it("approver can approve a pending proposal", async () => {
      const { rc, approver, proposalId, campaignId } = await withProposal();
      await expect(rc.connect(approver).approveSpending(proposalId))
        .to.emit(rc, "SpendingApproved")
        .withArgs(proposalId, campaignId, approver.address, anyValue);
    });

    it("approver can reject a pending proposal", async () => {
      const { rc, approver, proposalId, campaignId } = await withProposal();
      await expect(rc.connect(approver).rejectSpending(proposalId))
        .to.emit(rc, "SpendingRejected")
        .withArgs(proposalId, campaignId, approver.address, anyValue);
    });

    it("unauthorized user cannot approve", async () => {
      const { rc, stranger, proposalId } = await withProposal();
      await expect(rc.connect(stranger).approveSpending(proposalId)).to.be.reverted;
    });

    it("cannot approve an already approved proposal", async () => {
      const { rc, approver, proposalId } = await withProposal();
      await rc.connect(approver).approveSpending(proposalId);
      await expect(
        rc.connect(approver).approveSpending(proposalId)
      ).to.be.revertedWithCustomError(rc, "ProposalNotPending");
    });

    it("rejected proposal cannot be approved", async () => {
      const { rc, approver, proposalId } = await withProposal();
      await rc.connect(approver).rejectSpending(proposalId);
      await expect(
        rc.connect(approver).approveSpending(proposalId)
      ).to.be.revertedWithCustomError(rc, "ProposalNotPending");
    });

    it("unapproved (pending) proposal cannot be executed", async () => {
      const { rc, org, proposalId } = await withProposal();
      await expect(
        rc.connect(org).executeSpending(proposalId)
      ).to.be.revertedWithCustomError(rc, "ProposalNotApproved");
    });

    it("rejected proposal cannot be executed", async () => {
      const { rc, org, approver, proposalId } = await withProposal();
      await rc.connect(approver).rejectSpending(proposalId);
      await expect(
        rc.connect(org).executeSpending(proposalId)
      ).to.be.revertedWithCustomError(rc, "ProposalNotApproved");
    });

    it("approved proposal executes and transfers funds", async () => {
      const { rc, org, approver, recipient, proposalId, campaignId } = await withProposal();
      await rc.connect(approver).approveSpending(proposalId);
      const before = await ethers.provider.getBalance(recipient.address);
      await expect(rc.connect(org).executeSpending(proposalId))
        .to.emit(rc, "SpendingExecuted")
        .withArgs(proposalId, campaignId, org.address, recipient.address, ONE_ETH, anyValue);
      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.equal(ONE_ETH);
    });

    it("duplicate execution fails", async () => {
      const { rc, org, approver, proposalId } = await withProposal();
      await rc.connect(approver).approveSpending(proposalId);
      await rc.connect(org).executeSpending(proposalId);
      await expect(
        rc.connect(org).executeSpending(proposalId)
      ).to.be.revertedWithCustomError(rc, "ProposalNotApproved");
    });

    it("campaign balance decreases correctly after payout", async () => {
      const { rc, org, approver, donor, campaignId, proposalId } = await withProposal();
      // donate 1 more
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      await rc.connect(approver).approveSpending(proposalId);
      await rc.connect(org).executeSpending(proposalId);
      const [, , bal] = await rc.getCampaignTotals(campaignId);
      expect(bal).to.equal(ONE_ETH); // 2 donated, 1 paid out
    });

    it("totalPaidOut updates correctly", async () => {
      const { rc, org, approver, campaignId, proposalId } = await withProposal();
      await rc.connect(approver).approveSpending(proposalId);
      await rc.connect(org).executeSpending(proposalId);
      const [, paid] = await rc.getCampaignTotals(campaignId);
      expect(paid).to.equal(ONE_ETH);
    });

    it("unauthorized executor cannot execute approved proposal", async () => {
      const { rc, approver, stranger, proposalId } = await withProposal();
      await rc.connect(approver).approveSpending(proposalId);
      await expect(
        rc.connect(stranger).executeSpending(proposalId)
      ).to.be.reverted;
    });
  });

  // ── Accounting integrity ───────────────────────────────────────────────────
  describe("Accounting", () => {
    it("multiple campaigns maintain separate balances", async () => {
      const { rc, org, donor } = await deployFixture();
      await rc.connect(org).createCampaign("C1", "d", "Flood", "R", TARGET);
      await rc.connect(org).createCampaign("C2", "d", "Fire",  "R", TARGET);
      await rc.connect(donor).donate(1n, { value: ONE_ETH });
      await rc.connect(donor).donate(2n, { value: parseEther("3") });
      const [, , bal1] = await rc.getCampaignTotals(1n);
      const [, , bal2] = await rc.getCampaignTotals(2n);
      expect(bal1).to.equal(ONE_ETH);
      expect(bal2).to.equal(parseEther("3"));
    });

    it("distribution records do not affect financial balances", async () => {
      const { rc, donor, approver, campaignId } = await campaignFixture();
      await rc.connect(donor).donate(campaignId, { value: ONE_ETH });
      const [before] = await rc.getCampaignTotals(campaignId);
      await rc.connect(approver).recordDistribution(campaignId, "Food", 100n, "Kerala", "ipfs://d");
      const [after] = await rc.getCampaignTotals(campaignId);
      expect(before).to.equal(after);
    });
  });

  // ── Distribution records ───────────────────────────────────────────────────
  describe("recordDistribution()", () => {
    it("recorder can record a distribution event", async () => {
      const { rc, approver, campaignId } = await campaignFixture();
      await expect(
        rc.connect(approver).recordDistribution(campaignId, "Food", 200n, "Kerala", "ipfs://abc")
      )
        .to.emit(rc, "DistributionRecorded")
        .withArgs(1n, campaignId, "Food", 200n, "Kerala", approver.address, anyValue);
    });

    it("unauthorized caller cannot record distribution", async () => {
      const { rc, stranger, campaignId } = await campaignFixture();
      await expect(
        rc.connect(stranger).recordDistribution(campaignId, "Food", 100n, "R", "")
      ).to.be.reverted;
    });

    it("reverts for invalid campaign", async () => {
      const { rc, approver } = await deployFixture();
      await expect(
        rc.connect(approver).recordDistribution(999n, "Food", 100n, "R", "")
      ).to.be.revertedWithCustomError(rc, "InvalidCampaign");
    });
  });

  // ── Pause ──────────────────────────────────────────────────────────────────
  describe("Pause", () => {
    it("admin can pause and unpause", async () => {
      const { rc, admin, org, donor, campaignId } = await campaignFixture();
      await rc.connect(admin).pause();
      await expect(
        rc.connect(donor).donate(campaignId, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(rc, "EnforcedPause");
      await rc.connect(admin).unpause();
      await expect(rc.connect(donor).donate(campaignId, { value: ONE_ETH })).to.not.be.reverted;
    });

    it("non-admin cannot pause", async () => {
      const { rc, stranger } = await deployFixture();
      await expect(rc.connect(stranger).pause()).to.be.reverted;
    });
  });

  // ── closeCampaign ──────────────────────────────────────────────────────────
  describe("closeCampaign()", () => {
    it("creator can close their own campaign", async () => {
      const { rc, org, campaignId } = await campaignFixture();
      await expect(rc.connect(org).closeCampaign(campaignId))
        .to.emit(rc, "CampaignClosed")
        .withArgs(campaignId, org.address, anyValue);
      const c = await rc.getCampaign(campaignId);
      expect(c.status).to.equal(1n); // Closed
    });

    it("stranger cannot close a campaign", async () => {
      const { rc, stranger, campaignId } = await campaignFixture();
      await expect(rc.connect(stranger).closeCampaign(campaignId)).to.be.reverted;
    });
  });

  // ── Role management ────────────────────────────────────────────────────────
  describe("Role management", () => {
    it("admin can grant ORGANIZATION_ROLE", async () => {
      const { rc, admin, stranger } = await deployFixture();
      await rc.connect(admin).grantRole(ORGANIZATION_ROLE, stranger.address);
      expect(await rc.hasRole(ORGANIZATION_ROLE, stranger.address)).to.be.true;
    });

    it("admin can revoke ORGANIZATION_ROLE", async () => {
      const { rc, admin, org } = await deployFixture();
      await rc.connect(admin).revokeRole(ORGANIZATION_ROLE, org.address);
      expect(await rc.hasRole(ORGANIZATION_ROLE, org.address)).to.be.false;
    });

    it("non-admin cannot grant roles", async () => {
      const { rc, stranger, donor } = await deployFixture();
      await expect(
        rc.connect(stranger).grantRole(ORGANIZATION_ROLE, donor.address)
      ).to.be.reverted;
    });
  });
});

// ── Utility helpers ───────────────────────────────────────────────────────────
/** Convenience to get a signer that has no roles */
function stranger(any: SignerWithAddress): SignerWithAddress {
  return any; // caller must pass an account without the required role
}
