# Sulha on-chain ledger (`SulhaLedger`)

`SulhaLedger` is the real, reviewable smart contract behind Sulha's optional
on-chain anchoring path. It is a **minimal, append-only commitment registry**:
each `anchorId` maps to exactly one 32-byte `commitment`, and once written that
mapping is immutable.

> **Privacy first.** The contract stores **only hashes / salted commitments** —
> never PII, case numbers, party names, amounts, or free text. The backend
> relayer computes the commitment off-chain and anchors only that opaque value.
> Keeping content off-chain is required by Tunisia's INPDP / Law 2004-63.

## How it fits the app

The app's viem adapter (`src/lib/ledger/index.ts`) calls exactly one function:

```solidity
function anchor(bytes32 anchorId, bytes32 commitment) external; // RELAYER_ROLE only
```

- **Default: `LEDGER=memory`** — a deterministic in-memory registry (labelled
  "simulation" in the UI). **No chain, no Foundry, nothing to deploy.** This is
  what runs out of the box.
- **Optional upgrade: `LEDGER=anvil`** — the real on-chain path. Deploy this
  contract to a local Anvil chain (id `31337`) and point the app at it. The viem
  adapter signs `anchor(bytes32,bytes32)` with `RELAYER_PRIVATE_KEY` and waits
  for the transaction receipt.

The ABI the app uses is `anchor(bytes32 anchorId, bytes32 commitment)`
(nonpayable, no return) — this contract matches it exactly.

## Public interface

| Member | Kind | Notes |
| --- | --- | --- |
| `RELAYER_ROLE()` | `bytes32` constant | `keccak256("RELAYER_ROLE")` |
| `commitmentOf(bytes32) → bytes32` | view | `anchorId → commitment` (0 = unset) |
| `anchor(bytes32 anchorId, bytes32 commitment)` | external, `onlyRole(RELAYER_ROLE)` | stores + emits; idempotent on identical re-submit; reverts on a different commitment for the same id; reverts on zero inputs |
| `verify(bytes32 anchorId, bytes32 commitment) → bool` | view | true iff `commitment` is non-zero and equals the stored value |
| `event Anchored(bytes32 indexed anchorId, bytes32 commitment, uint256 ts)` | event | emitted on a new anchor |
| plus OpenZeppelin `AccessControl` | — | `hasRole`, `grantRole`, `revokeRole`, `DEFAULT_ADMIN_ROLE`, … |

Constructor: `constructor(address initialRelayer)` — always grants
`DEFAULT_ADMIN_ROLE` + `RELAYER_ROLE` to the deployer; also grants
`RELAYER_ROLE` to `initialRelayer` when it is non-zero. Pass `address(0)` to
grant to the deployer only.

Custom errors: `ZeroAnchorId()`, `ZeroCommitment()`,
`CommitmentAlreadySet(bytes32 anchorId, bytes32 existing, bytes32 attempted)`.

---

## 1. Install Foundry (cross-platform)

Foundry provides `forge` (build/test), `anvil` (local chain), and `cast`.

### macOS / Linux

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

> **macOS PATH gotcha.** Foundry installs to `~/.foundry/bin`, which is **not
> necessarily on your `PATH`**. Do **not** assume `forge` is directly callable.
> Either invoke tools with the full path:
>
> ```bash
> ~/.foundry/bin/forge --version
> ~/.foundry/bin/anvil
> ```
>
> …or add the directory to your PATH manually for the current shell:
>
> ```bash
> export PATH="$HOME/.foundry/bin:$PATH"
> ```
>
> (Persisting it in your shell profile is your call — this project does not
> modify your PATH for you.) The commands below are shown as bare `forge` /
> `anvil`; prefix them with `~/.foundry/bin/` if they aren't on your PATH.

### Windows

Foundry's installer is a shell script, so run it from a Unix-like shell:

- **Git Bash** (ships with Git for Windows):

  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

  Then restart Git Bash so `foundryup` and `forge` are picked up. If they are
  not found, add `%USERPROFILE%\.foundry\bin` to your Windows `PATH` (or call
  the tools by full path, e.g. `~/.foundry/bin/forge` inside Git Bash).

- **WSL (recommended)** — inside your WSL distro treat it exactly like Linux:

  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

## 2. Install dependencies

From the `contracts/` directory:

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

This populates `lib/openzeppelin-contracts/` and `lib/forge-std/`.

**Remappings.** `remappings.txt` (and `foundry.toml`) map the import prefixes so
that `import "@openzeppelin/contracts/access/AccessControl.sol"` resolves:

```
@openzeppelin/=lib/openzeppelin-contracts/
forge-std/=lib/forge-std/src/
```

> If `forge install` reports it needs a git repo, run `git init` inside
> `contracts/` first (or install into an existing repo). The pinned deps live
> under `lib/` and are git-ignored here.

## 3. Build & test

```bash
cd contracts
forge build
forge test -vvv
```

The test suite (`test/SulhaLedger.t.sol`) covers: store + `Anchored` event,
idempotent same-commitment re-submit, revert on a different commitment for the
same id, revert on zero anchorId/commitment, `RELAYER_ROLE` enforcement, and
`verify()` true/false — plus a fuzz test.

## 4. Run a local chain (Anvil)

In a dedicated terminal:

```bash
anvil
```

Anvil starts on `http://127.0.0.1:8545` with chain id **31337** and prints ten
funded dev accounts. **Account #0** is:

- address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

> These keys are the well-known public Anvil defaults — for **local testing
> only**, never on a real network.

## 5. Deploy

From `contracts/`, with Anvil running:

```bash
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

The script deploys `SulhaLedger` and logs the deployed address:

```
SulhaLedger deployed at: 0x....
```

Copy that address. (Optional: set `RELAYER_ADDRESS=0x...` in the environment
before running to grant `RELAYER_ROLE` to an additional relayer at construction;
otherwise only the deployer holds it.)

## 6. Point the app at the deployed contract

Set these in the **app's** `.env` (project root — this is documentation only;
edit the app's env yourself, this contracts package does not touch it):

```dotenv
LEDGER=anvil
ANVIL_RPC_URL=http://127.0.0.1:8545
LEDGER_CONTRACT_ADDRESS=<address printed by the deploy script>
# Anvil account #0 — local dev only, never a real key:
RELAYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

The deployer above (Anvil key #0 → `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
holds `RELAYER_ROLE`, so the same key used as `RELAYER_PRIVATE_KEY` is authorized
to call `anchor(...)`. Restart the app so it re-reads `.env`; new anchors now go
on-chain and receipts carry a real `txHash` / `blockNumber`.

To go back to the zero-setup default, set `LEDGER=memory` (or unset it) — no
chain required.
