"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function markAllReadAction() {
  const s = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: s.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markReadAction(id: string) {
  const s = await requireSession();
  await prisma.notification.updateMany({
    where: { id, userId: s.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}
