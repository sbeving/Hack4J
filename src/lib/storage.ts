import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { keccakOfBuffer } from "@/lib/hash";

// Immutable local object store (gitignored). Originals are never overwritten.
const STORAGE_ROOT = path.join(process.cwd(), "storage");

const EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/markdown": ".md",
};

export type StoredFile = {
  storageKey: string;
  byteCount: number;
  contentHash: `0x${string}`;
};

export async function saveFile(
  caseId: string,
  buffer: Buffer,
  mime: string
): Promise<StoredFile> {
  const dir = path.join(STORAGE_ROOT, caseId);
  await fs.mkdir(dir, { recursive: true });
  const ext = EXT[mime] ?? "";
  const storageKey = path.posix.join(caseId, `${randomUUID()}${ext}`);
  await fs.writeFile(path.join(STORAGE_ROOT, storageKey), buffer);
  return {
    storageKey,
    byteCount: buffer.byteLength,
    contentHash: keccakOfBuffer(buffer),
  };
}

export async function readFile(storageKey: string): Promise<Buffer> {
  return fs.readFile(path.join(STORAGE_ROOT, storageKey));
}

export async function saveArtifact(
  relKey: string,
  buffer: Buffer
): Promise<StoredFile> {
  const full = path.join(STORAGE_ROOT, relKey);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
  return {
    storageKey: relKey,
    byteCount: buffer.byteLength,
    contentHash: keccakOfBuffer(buffer),
  };
}

export function storagePath(storageKey: string): string {
  return path.join(STORAGE_ROOT, storageKey);
}

export async function deleteFile(storageKey: string): Promise<void> {
  await fs.unlink(path.join(STORAGE_ROOT, storageKey));
}
