// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {SulhaLedger} from "../src/SulhaLedger.sol";

contract SulhaLedgerTest is Test {
    SulhaLedger internal ledger;

    address internal admin = address(this); // deployer
    address internal relayer = makeAddr("relayer");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant ANCHOR_ID = bytes32(uint256(0xA11CE));
    bytes32 internal constant COMMITMENT = keccak256("commitment-v1");
    bytes32 internal constant OTHER_COMMITMENT = keccak256("commitment-v2");

    // Redeclared so the test can build the expected log for expectEmit.
    event Anchored(bytes32 indexed anchorId, bytes32 commitment, uint256 ts);

    function setUp() public {
        // Deployer (this contract) gets DEFAULT_ADMIN_ROLE + RELAYER_ROLE, and
        // `relayer` is granted RELAYER_ROLE via the constructor param.
        ledger = new SulhaLedger(relayer);
    }

    // --- constructor / roles ---------------------------------------------

    function test_ConstructorGrantsRoles() public view {
        assertTrue(ledger.hasRole(ledger.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(ledger.hasRole(ledger.RELAYER_ROLE(), admin));
        assertTrue(ledger.hasRole(ledger.RELAYER_ROLE(), relayer));
        assertFalse(ledger.hasRole(ledger.RELAYER_ROLE(), stranger));
    }

    // --- anchor: happy path ----------------------------------------------

    function test_AnchorStoresAndEmits() public {
        vm.expectEmit(true, false, false, true, address(ledger));
        emit Anchored(ANCHOR_ID, COMMITMENT, block.timestamp);

        vm.prank(relayer);
        ledger.anchor(ANCHOR_ID, COMMITMENT);

        assertEq(ledger.commitmentOf(ANCHOR_ID), COMMITMENT);
    }

    // --- anchor: idempotency & immutability -------------------------------

    function test_AnchorIdempotentSameCommitment() public {
        vm.startPrank(relayer);
        ledger.anchor(ANCHOR_ID, COMMITMENT);
        // Re-submitting the identical commitment must NOT revert.
        ledger.anchor(ANCHOR_ID, COMMITMENT);
        vm.stopPrank();

        assertEq(ledger.commitmentOf(ANCHOR_ID), COMMITMENT);
        assertTrue(ledger.verify(ANCHOR_ID, COMMITMENT));
    }

    function test_AnchorRevertsOnDifferentCommitment() public {
        vm.startPrank(relayer);
        ledger.anchor(ANCHOR_ID, COMMITMENT);

        vm.expectRevert(
            abi.encodeWithSelector(
                SulhaLedger.CommitmentAlreadySet.selector,
                ANCHOR_ID,
                COMMITMENT,
                OTHER_COMMITMENT
            )
        );
        ledger.anchor(ANCHOR_ID, OTHER_COMMITMENT);
        vm.stopPrank();

        // Original commitment is untouched.
        assertEq(ledger.commitmentOf(ANCHOR_ID), COMMITMENT);
    }

    // --- anchor: input validation ----------------------------------------

    function test_AnchorRevertsOnZeroAnchorId() public {
        vm.prank(relayer);
        vm.expectRevert(SulhaLedger.ZeroAnchorId.selector);
        ledger.anchor(bytes32(0), COMMITMENT);
    }

    function test_AnchorRevertsOnZeroCommitment() public {
        vm.prank(relayer);
        vm.expectRevert(SulhaLedger.ZeroCommitment.selector);
        ledger.anchor(ANCHOR_ID, bytes32(0));
    }

    // --- anchor: access control ------------------------------------------

    function test_OnlyRelayerCanAnchor() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                ledger.RELAYER_ROLE()
            )
        );
        ledger.anchor(ANCHOR_ID, COMMITMENT);
    }

    function test_AdminCanAnchorToo() public {
        // Deployer holds RELAYER_ROLE as well.
        ledger.anchor(ANCHOR_ID, COMMITMENT);
        assertEq(ledger.commitmentOf(ANCHOR_ID), COMMITMENT);
    }

    // --- verify ----------------------------------------------------------

    function test_VerifyTrueAndFalse() public {
        // Unset anchor -> false, even for a non-zero commitment.
        assertFalse(ledger.verify(ANCHOR_ID, COMMITMENT));

        vm.prank(relayer);
        ledger.anchor(ANCHOR_ID, COMMITMENT);

        assertTrue(ledger.verify(ANCHOR_ID, COMMITMENT));       // correct commitment
        assertFalse(ledger.verify(ANCHOR_ID, OTHER_COMMITMENT)); // wrong commitment
        assertFalse(ledger.verify(ANCHOR_ID, bytes32(0)));       // zero never verifies
    }

    // --- fuzz ------------------------------------------------------------

    function testFuzz_AnchorAndVerify(bytes32 anchorId, bytes32 commitment) public {
        vm.assume(anchorId != bytes32(0));
        vm.assume(commitment != bytes32(0));

        vm.prank(relayer);
        ledger.anchor(anchorId, commitment);

        assertEq(ledger.commitmentOf(anchorId), commitment);
        assertTrue(ledger.verify(anchorId, commitment));
    }
}
