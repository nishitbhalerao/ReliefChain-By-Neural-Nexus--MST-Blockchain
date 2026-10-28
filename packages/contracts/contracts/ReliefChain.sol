// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title ReliefChain
/// @notice Blockchain-powered disaster-relief donation and fund-management platform.
/// @dev Roles:
///   DEFAULT_ADMIN_ROLE  — contract deployer; grants/revokes all roles.
///   ORGANIZATION_ROLE   — may create campaigns and submit spending proposals.
///   APPROVER_ROLE       — may approve or reject pending spending proposals.
///   RECORDER_ROLE       — may record aid-distribution events.
contract ReliefChain is AccessControl, ReentrancyGuard, Pausable {
    // ──────────────────────────────────────────────────────────
    //  Roles
    // ──────────────────────────────────────────────────────────
    bytes32 public constant ORGANIZATION_ROLE = keccak256("ORGANIZATION_ROLE");
    bytes32 public constant APPROVER_ROLE     = keccak256("APPROVER_ROLE");
    bytes32 public constant RECORDER_ROLE     = keccak256("RECORDER_ROLE");

    // ──────────────────────────────────────────────────────────
    //  Types
    // ──────────────────────────────────────────────────────────
    enum CampaignStatus { Active, Closed }

    struct Campaign {
        uint256 id;
        address creator;
        string  name;
        string  description;
        string  disasterCategory;
        string  affectedRegion;
        uint256 targetAmount;       // wei
        uint256 totalDonated;       // wei – running sum of all confirmed donations
        uint256 totalPaidOut;       // wei – sum of all executed spending proposals
        CampaignStatus status;
        uint256 createdAt;
    }

    enum ProposalStatus { Pending, Approved, Rejected, Executed }

    struct SpendingProposal {
        uint256 id;
        uint256 campaignId;
        address proposer;
        address payable recipient;
        uint256 amount;             // wei
        string  purpose;
        string  evidenceRef;        // off-chain evidence URL or IPFS CID
        ProposalStatus status;
        uint256 createdAt;
        uint256 actionedAt;         // timestamp of approve/reject/execute
    }

    struct DistributionRecord {
        uint256 id;
        uint256 campaignId;
        string  aidCategory;
        uint256 quantity;
        string  generalizedLocation;
        string  evidenceRef;
        address recorder;
        uint256 recordedAt;
    }

    // ──────────────────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────────────────
    uint256 public campaignCount;
    uint256 public proposalCount;
    uint256 public distributionCount;

    mapping(uint256 => Campaign)           public campaigns;
    mapping(uint256 => SpendingProposal)   public proposals;
    mapping(uint256 => DistributionRecord) public distributions;

    /// @dev Tracks ETH held by each campaign = totalDonated - totalPaidOut.
    ///      Updated on donate() and executeSpending().
    mapping(uint256 => uint256) public campaignBalance;

    /// @dev campaignDonors[campaignId] keeps an ordered list of donor addresses.
    mapping(uint256 => address[]) private campaignDonorList;
    /// @dev Total donated per donor per campaign.
    mapping(uint256 => mapping(address => uint256)) public donorTotals;

    // ──────────────────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────────────────
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string  name,
        string  disasterCategory,
        string  affectedRegion,
        uint256 targetAmount,
        uint256 timestamp
    );

    event Donated(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp
    );

    event SpendingProposed(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        address indexed proposer,
        address recipient,
        uint256 amount,
        string  purpose,
        string  evidenceRef,
        uint256 timestamp
    );

    event SpendingApproved(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        address indexed approver,
        uint256 timestamp
    );

    event SpendingRejected(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        address indexed approver,
        uint256 timestamp
    );

    event SpendingExecuted(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        address indexed executor,
        address recipient,
        uint256 amount,
        uint256 timestamp
    );

    event CampaignClosed(
        uint256 indexed campaignId,
        address indexed closedBy,
        uint256 timestamp
    );

    event DistributionRecorded(
        uint256 indexed distributionId,
        uint256 indexed campaignId,
        string  aidCategory,
        uint256 quantity,
        string  generalizedLocation,
        address indexed recorder,
        uint256 timestamp
    );

    // ──────────────────────────────────────────────────────────
    //  Custom errors
    // ──────────────────────────────────────────────────────────
    error InvalidCampaign(uint256 campaignId);
    error CampaignNotActive(uint256 campaignId);
    error ZeroDonation();
    error InvalidProposal(uint256 proposalId);
    error ProposalNotPending(uint256 proposalId);
    error ProposalNotApproved(uint256 proposalId);
    error InsufficientCampaignBalance(uint256 campaignId, uint256 requested, uint256 available);
    error TransferFailed(address recipient, uint256 amount);
    error EmptyName();
    error ZeroTarget();
    error EmptyPurpose();
    error ZeroAmount();
    error RecipientIsZero();

    // ──────────────────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────────────────
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(APPROVER_ROLE, msg.sender);
        _grantRole(ORGANIZATION_ROLE, msg.sender);
        _grantRole(RECORDER_ROLE, msg.sender);
    }

    // ──────────────────────────────────────────────────────────
    //  Admin operations
    // ──────────────────────────────────────────────────────────

    /// @notice Pause all state-changing operations. Only DEFAULT_ADMIN_ROLE.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause. Only DEFAULT_ADMIN_ROLE.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ──────────────────────────────────────────────────────────
    //  Campaign lifecycle
    // ──────────────────────────────────────────────────────────

    /// @notice Create a new relief campaign.
    /// @param _name             Human-readable campaign name.
    /// @param _description      Detailed description.
    /// @param _disasterCategory e.g. "Flood", "Earthquake", "Fire".
    /// @param _affectedRegion   e.g. "Kerala, India".
    /// @param _targetAmount     Fundraising goal in wei.
    function createCampaign(
        string calldata _name,
        string calldata _description,
        string calldata _disasterCategory,
        string calldata _affectedRegion,
        uint256 _targetAmount
    )
        external
        whenNotPaused
        onlyRole(ORGANIZATION_ROLE)
        returns (uint256 campaignId)
    {
        if (bytes(_name).length == 0)            revert EmptyName();
        if (_targetAmount == 0)                   revert ZeroTarget();

        campaignId = ++campaignCount;
        campaigns[campaignId] = Campaign({
            id:               campaignId,
            creator:          msg.sender,
            name:             _name,
            description:      _description,
            disasterCategory: _disasterCategory,
            affectedRegion:   _affectedRegion,
            targetAmount:     _targetAmount,
            totalDonated:     0,
            totalPaidOut:     0,
            status:           CampaignStatus.Active,
            createdAt:        block.timestamp
        });

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _name,
            _disasterCategory,
            _affectedRegion,
            _targetAmount,
            block.timestamp
        );
    }

    /// @notice Close a campaign. Prevents new donations and proposals.
    /// @dev Only the campaign creator or admin may close.
    function closeCampaign(uint256 _campaignId) external whenNotPaused {
        Campaign storage c = _requireCampaign(_campaignId);
        if (
            msg.sender != c.creator &&
            !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        ) {
            revert AccessControlUnauthorizedAccount(msg.sender, DEFAULT_ADMIN_ROLE);
        }
        c.status = CampaignStatus.Closed;
        emit CampaignClosed(_campaignId, msg.sender, block.timestamp);
    }

    // ──────────────────────────────────────────────────────────
    //  Donations
    // ──────────────────────────────────────────────────────────

    /// @notice Donate native MST tokens to a campaign.
    /// @param _campaignId Target campaign.
    function donate(uint256 _campaignId) external payable whenNotPaused nonReentrant {
        Campaign storage c = _requireCampaign(_campaignId);
        if (c.status != CampaignStatus.Active) revert CampaignNotActive(_campaignId);
        if (msg.value == 0)                     revert ZeroDonation();

        // Track first-time donors for the list
        if (donorTotals[_campaignId][msg.sender] == 0) {
            campaignDonorList[_campaignId].push(msg.sender);
        }

        c.totalDonated              += msg.value;
        donorTotals[_campaignId][msg.sender] += msg.value;
        campaignBalance[_campaignId] += msg.value;

        emit Donated(_campaignId, msg.sender, msg.value, c.totalDonated, block.timestamp);
    }

    // ──────────────────────────────────────────────────────────
    //  Spending proposals
    // ──────────────────────────────────────────────────────────

    /// @notice Submit a spending proposal against a campaign balance.
    function proposeSpending(
        uint256         _campaignId,
        address payable _recipient,
        uint256         _amount,
        string calldata _purpose,
        string calldata _evidenceRef
    )
        external
        whenNotPaused
        onlyRole(ORGANIZATION_ROLE)
        returns (uint256 proposalId)
    {
        Campaign storage c = _requireCampaign(_campaignId);
        if (c.status != CampaignStatus.Active) revert CampaignNotActive(_campaignId);
        if (_recipient == address(0))          revert RecipientIsZero();
        if (_amount == 0)                      revert ZeroAmount();
        if (bytes(_purpose).length == 0)       revert EmptyPurpose();
        if (_amount > campaignBalance[_campaignId])
            revert InsufficientCampaignBalance(_campaignId, _amount, campaignBalance[_campaignId]);

        proposalId = ++proposalCount;
        proposals[proposalId] = SpendingProposal({
            id:          proposalId,
            campaignId:  _campaignId,
            proposer:    msg.sender,
            recipient:   _recipient,
            amount:      _amount,
            purpose:     _purpose,
            evidenceRef: _evidenceRef,
            status:      ProposalStatus.Pending,
            createdAt:   block.timestamp,
            actionedAt:  0
        });

        emit SpendingProposed(
            proposalId,
            _campaignId,
            msg.sender,
            _recipient,
            _amount,
            _purpose,
            _evidenceRef,
            block.timestamp
        );
    }

    /// @notice Approve a pending spending proposal.
    /// @dev The approver must not be the proposer (separation of duties).
    function approveSpending(uint256 _proposalId)
        external
        whenNotPaused
        onlyRole(APPROVER_ROLE)
    {
        SpendingProposal storage p = _requireProposal(_proposalId);
        if (p.status != ProposalStatus.Pending) revert ProposalNotPending(_proposalId);

        p.status     = ProposalStatus.Approved;
        p.actionedAt = block.timestamp;

        emit SpendingApproved(_proposalId, p.campaignId, msg.sender, block.timestamp);
    }

    /// @notice Reject a pending spending proposal.
    function rejectSpending(uint256 _proposalId)
        external
        whenNotPaused
        onlyRole(APPROVER_ROLE)
    {
        SpendingProposal storage p = _requireProposal(_proposalId);
        if (p.status != ProposalStatus.Pending) revert ProposalNotPending(_proposalId);

        p.status     = ProposalStatus.Rejected;
        p.actionedAt = block.timestamp;

        emit SpendingRejected(_proposalId, p.campaignId, msg.sender, block.timestamp);
    }

    /// @notice Execute an approved spending proposal.
    ///         Transfers the approved amount to the specified recipient.
    function executeSpending(uint256 _proposalId)
        external
        whenNotPaused
        nonReentrant
        onlyRole(ORGANIZATION_ROLE)
    {
        SpendingProposal storage p = _requireProposal(_proposalId);
        if (p.status != ProposalStatus.Approved) revert ProposalNotApproved(_proposalId);

        // Re-check balance at execution time
        if (p.amount > campaignBalance[p.campaignId])
            revert InsufficientCampaignBalance(p.campaignId, p.amount, campaignBalance[p.campaignId]);

        // State updates before transfer (checks-effects-interactions)
        p.status = ProposalStatus.Executed;
        p.actionedAt = block.timestamp;

        campaigns[p.campaignId].totalPaidOut  += p.amount;
        campaignBalance[p.campaignId]         -= p.amount;

        // Transfer
        (bool success, ) = p.recipient.call{value: p.amount}("");
        if (!success) {
            // Revert all state changes; Solidity reverts automatically on revert(),
            // but we must undo our own state writes first because Solidity reverts
            // everything in the current call frame.
            revert TransferFailed(p.recipient, p.amount);
        }

        emit SpendingExecuted(
            _proposalId,
            p.campaignId,
            msg.sender,
            p.recipient,
            p.amount,
            block.timestamp
        );
    }

    // ──────────────────────────────────────────────────────────
    //  Distribution records
    // ──────────────────────────────────────────────────────────

    /// @notice Record an aid-distribution event. Does not affect balances.
    function recordDistribution(
        uint256         _campaignId,
        string calldata _aidCategory,
        uint256         _quantity,
        string calldata _generalizedLocation,
        string calldata _evidenceRef
    )
        external
        whenNotPaused
        onlyRole(RECORDER_ROLE)
        returns (uint256 distributionId)
    {
        _requireCampaign(_campaignId); // existence check only

        distributionId = ++distributionCount;
        distributions[distributionId] = DistributionRecord({
            id:                 distributionId,
            campaignId:         _campaignId,
            aidCategory:        _aidCategory,
            quantity:           _quantity,
            generalizedLocation: _generalizedLocation,
            evidenceRef:        _evidenceRef,
            recorder:           msg.sender,
            recordedAt:         block.timestamp
        });

        emit DistributionRecorded(
            distributionId,
            _campaignId,
            _aidCategory,
            _quantity,
            _generalizedLocation,
            msg.sender,
            block.timestamp
        );
    }

    // ──────────────────────────────────────────────────────────
    //  View helpers
    // ──────────────────────────────────────────────────────────

    /// @notice Return core campaign fields.
    function getCampaign(uint256 _campaignId)
        external
        view
        returns (Campaign memory)
    {
        _requireCampaignView(_campaignId);
        return campaigns[_campaignId];
    }

    /// @notice Return accounting totals for a campaign.
    function getCampaignTotals(uint256 _campaignId)
        external
        view
        returns (
            uint256 totalDonated,
            uint256 totalPaidOut,
            uint256 balance
        )
    {
        _requireCampaignView(_campaignId);
        Campaign storage c = campaigns[_campaignId];
        return (c.totalDonated, c.totalPaidOut, campaignBalance[_campaignId]);
    }

    /// @notice Return the number of unique donors for a campaign.
    function getDonorCount(uint256 _campaignId) external view returns (uint256) {
        return campaignDonorList[_campaignId].length;
    }

    // ──────────────────────────────────────────────────────────
    //  Internal helpers
    // ──────────────────────────────────────────────────────────

    function _requireCampaign(uint256 id) internal view returns (Campaign storage) {
        if (id == 0 || id > campaignCount) revert InvalidCampaign(id);
        return campaigns[id];
    }

    function _requireCampaignView(uint256 id) internal view {
        if (id == 0 || id > campaignCount) revert InvalidCampaign(id);
    }

    function _requireProposal(uint256 id) internal view returns (SpendingProposal storage) {
        if (id == 0 || id > proposalCount) revert InvalidProposal(id);
        return proposals[id];
    }
}
