// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title SulhaLedger
/// @notice Minimal, append-only commitment registry for the Sulha claims-dispute
///         platform. Each `anchorId` maps to exactly one `commitment` and, once
///         written, that mapping is immutable.
/// @dev    PRIVACY: This contract stores ONLY 32-byte hashes / salted commitments.
///         It must NEVER receive PII, case numbers, party names, amounts, free
///         text, or any raw subject bytes. The off-chain relayer computes
///         `commitment = keccak256(domain || keccak(subjectType) || subjectDigest || salt)`
///         and anchors that opaque value. Keeping the underlying content off-chain
///         is required by Tunisia's INPDP / Law 2004-63.
contract SulhaLedger is AccessControl {
    /// @notice Role permitted to write anchors. Held by the backend relayer.
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    /// @notice Immutable mapping of anchorId => commitment. A zero value means
    ///         the anchorId has never been written.
    mapping(bytes32 => bytes32) public commitmentOf;

    /// @notice Emitted when a new commitment is anchored for an anchorId.
    /// @param anchorId   The opaque, unique identifier for this anchoring.
    /// @param commitment The salted commitment hash being anchored.
    /// @param ts         The block timestamp at which the anchor was written.
    event Anchored(bytes32 indexed anchorId, bytes32 commitment, uint256 ts);

    /// @notice Thrown when `anchorId` is the zero value.
    error ZeroAnchorId();
    /// @notice Thrown when `commitment` is the zero value.
    error ZeroCommitment();
    /// @notice Thrown when an anchorId already holds a DIFFERENT commitment.
    /// @param anchorId   The anchorId whose commitment is already fixed.
    /// @param existing   The commitment currently stored on-chain.
    /// @param attempted  The (rejected) commitment the caller tried to write.
    error CommitmentAlreadySet(bytes32 anchorId, bytes32 existing, bytes32 attempted);

    /// @param initialRelayer Optional additional address to grant RELAYER_ROLE.
    ///        Pass `address(0)` to grant roles to the deployer only. The deployer
    ///        (`msg.sender`) always receives both DEFAULT_ADMIN_ROLE and RELAYER_ROLE.
    constructor(address initialRelayer) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
        if (initialRelayer != address(0) && initialRelayer != msg.sender) {
            _grantRole(RELAYER_ROLE, initialRelayer);
        }
    }

    /// @notice Anchor a salted commitment under an anchorId.
    /// @dev    Append-only semantics:
    ///         - reverts if `anchorId` or `commitment` is zero;
    ///         - idempotent no-op if the identical commitment is re-submitted
    ///           (state unchanged, no event) so a retrying relayer never fails;
    ///         - reverts with {CommitmentAlreadySet} if a DIFFERENT commitment is
    ///           submitted for an anchorId that is already written (immutability);
    ///         - otherwise stores the commitment and emits {Anchored}.
    /// @param anchorId   Opaque unique id for this anchoring (never PII).
    /// @param commitment Salted commitment hash to store (never PII).
    function anchor(bytes32 anchorId, bytes32 commitment) external onlyRole(RELAYER_ROLE) {
        if (anchorId == bytes32(0)) revert ZeroAnchorId();
        if (commitment == bytes32(0)) revert ZeroCommitment();

        bytes32 existing = commitmentOf[anchorId];
        if (existing != bytes32(0)) {
            // Already anchored: identical is a safe retry; different is forbidden.
            if (existing == commitment) return;
            revert CommitmentAlreadySet(anchorId, existing, commitment);
        }

        commitmentOf[anchorId] = commitment;
        emit Anchored(anchorId, commitment, block.timestamp);
    }

    /// @notice Check whether `anchorId` is anchored to exactly `commitment`.
    /// @param anchorId   The anchorId to check.
    /// @param commitment The commitment to compare against the stored value.
    /// @return True if `commitment` is non-zero and equals the stored commitment.
    function verify(bytes32 anchorId, bytes32 commitment) external view returns (bool) {
        return commitment != bytes32(0) && commitmentOf[anchorId] == commitment;
    }
}
