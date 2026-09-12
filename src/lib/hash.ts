import { keccak256, toBytes, stringToHex } from "viem";

/** keccak256 over raw bytes (file contents). Returns 0x-prefixed hex. */
export function keccakOfBytes(bytes: Uint8Array): `0x${string}` {
  return keccak256(bytes);
}

/** keccak256 over a UTF-8 string. */
export function keccakOfString(s: string): `0x${string}` {
  return keccak256(toBytes(s));
}

/** keccak256 over a Buffer (Node file read). */
export function keccakOfBuffer(buf: Buffer): `0x${string}` {
  return keccak256(new Uint8Array(buf));
}

export { toBytes, stringToHex };
