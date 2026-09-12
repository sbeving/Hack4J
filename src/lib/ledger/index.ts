import "server-only";
import { keccak256, concat, type Hex } from "viem";
import { prisma } from "@/lib/db";
import { keccakOfString } from "@/lib/hash";
import { makeAnchorId, makeSalt } from "@/lib/ids";

// Append-only commitment registry. We anchor a *salted commitment* over a
// subject digest — never the raw hash, PII, case number or amounts. Keeping
// text off-chain is required by Tunisia's INPDP / Law 2004-63.
const LEDGER = (process.env.LEDGER || "memory").toLowerCase();
const ANCHOR_DOMAIN = keccakOfString("SULHA_ANCHOR_V1");

export type SubjectType = "evidence" | "notice" | "dossier" | "settlement" | "event";

function computeCommitment(subjectType: string, digest: Hex, salt: Hex): Hex {
  // keccak256(domain || keccak(subjectType) || subjectDigest || salt)
  return keccak256(concat([ANCHOR_DOMAIN, keccakOfString(subjectType), digest, salt]));
}

/**
 * Anchor one subject version. Never throws into the business flow — on a ledger
 * failure the receipt is stored with status "failed" and the caller proceeds.
 */
export async function anchor(input: {
  caseId?: string | null;
  subjectType: SubjectType;
  subjectId: string;
  subjectVersion?: number;
  digest: string; // 0x… keccak256 of the subject bytes/canonical JSON
}) {
  const digest = (input.digest.startsWith("0x") ? input.digest : `0x${input.digest}`) as Hex;
  const salt = makeSalt();
  const commitment = computeCommitment(input.subjectType, digest, salt);
  const anchorId = makeAnchorId();

  let txHash: string | null = null;
  let blockNumber: number | null = null;
  let chainId: number | null = null;
  let contractAddress: string | null = null;
  let status = "confirmed";
  let adapter = LEDGER;

  try {
    if (LEDGER === "anvil" && process.env.LEDGER_CONTRACT_ADDRESS && process.env.RELAYER_PRIVATE_KEY) {
      const result = await anchorOnAnvil(anchorId as Hex, commitment);
      txHash = result.txHash;
      blockNumber = result.blockNumber;
      chainId = result.chainId;
      contractAddress = process.env.LEDGER_CONTRACT_ADDRESS;
      adapter = "anvil";
    } else {
      // Deterministic in-memory registry (labelled "simulation" in the UI).
      const count = await prisma.anchorReceipt.count();
      txHash = keccak256(concat([anchorId as Hex, commitment]));
      blockNumber = 1_000_000 + count;
      chainId = 31337;
      contractAddress = "0x00000000000000000000000000000000000000AC";
      adapter = "memory";
    }
  } catch {
    status = "failed";
    adapter = LEDGER;
  }

  return prisma.anchorReceipt.create({
    data: {
      caseId: input.caseId ?? null,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      subjectVersion: input.subjectVersion ?? 1,
      rawDigest: digest,
      salt,
      commitment,
      anchorId,
      chainId,
      contractAddress,
      txHash,
      blockNumber,
      status,
      adapter,
    },
  });
}

/** Real on-chain anchoring (only when LEDGER=anvil + contract deployed). */
async function anchorOnAnvil(
  anchorId: Hex,
  commitment: Hex
): Promise<{ txHash: string; blockNumber: number; chainId: number }> {
  const { createWalletClient, createPublicClient, http } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");
  const { foundry } = await import("viem/chains");

  const rpc = process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545";
  const account = privateKeyToAccount(process.env.RELAYER_PRIVATE_KEY as Hex);
  const wallet = createWalletClient({ account, chain: foundry, transport: http(rpc) });
  const pub = createPublicClient({ chain: foundry, transport: http(rpc) });

  const abi = [
    {
      type: "function",
      name: "anchor",
      stateMutability: "nonpayable",
      inputs: [
        { name: "anchorId", type: "bytes32" },
        { name: "commitment", type: "bytes32" },
      ],
      outputs: [],
    },
  ] as const;

  const txHash = await wallet.writeContract({
    address: process.env.LEDGER_CONTRACT_ADDRESS as Hex,
    abi,
    functionName: "anchor",
    args: [anchorId, commitment],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
  return { txHash, blockNumber: Number(receipt.blockNumber), chainId: foundry.id };
}
