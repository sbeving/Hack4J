// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {SulhaLedger} from "../src/SulhaLedger.sol";

/// @title Deploy
/// @notice Foundry deployment script for {SulhaLedger}.
/// @dev    The deployer/signer comes from the CLI, e.g.:
///
///           forge script script/Deploy.s.sol \
///             --rpc-url http://127.0.0.1:8545 \
///             --private-key <anvil key0> \
///             --broadcast
///
///         An optional extra relayer address may be supplied via the
///         RELAYER_ADDRESS env var; when unset, only the deployer receives
///         DEFAULT_ADMIN_ROLE + RELAYER_ROLE.
contract Deploy is Script {
    function run() external returns (SulhaLedger ledger) {
        // Optional additional relayer; defaults to address(0) (deployer only).
        address initialRelayer = vm.envOr("RELAYER_ADDRESS", address(0));

        // Uses the account provided via --private-key / --sender on the CLI.
        vm.startBroadcast();
        ledger = new SulhaLedger(initialRelayer);
        vm.stopBroadcast();

        console2.log("SulhaLedger deployed at:", address(ledger));
        console2.log("Extra relayer granted  :", initialRelayer);
        console2.log("Set app .env LEDGER_CONTRACT_ADDRESS to the address above.");
    }
}
