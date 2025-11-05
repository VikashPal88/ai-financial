"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath, revalidateTag } from "next/cache";
// ✅ change this import
import { unstable_noStore as noStore } from "next/cache";


import type { Prisma } from "@prisma/client";

// Works for both Prisma.Decimal and number
const serializeDecimal = (obj: any) => {
  const serialized: any = { ...obj };
  if (obj?.balance != null) {
    serialized.balance = Number(obj.balance);
  }
  if (obj?.amount != null) {
    serialized.amount = Number(obj.amount);
  }
  return serialized;
};

export async function getAccountWithTransactions(accountId: string) {
  noStore(); // ⛔️ disable caching for this call
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const account = await db.account.findFirst({
    where: { id: accountId, userId: user.id },
    include: {
      transactions: { orderBy: { date: "desc" } },
      _count: { select: { transactions: true } },
    },
  });


  if (!account) return null;

  return {
    ...serializeDecimal(account),
    transactions: account.transactions.map(serializeDecimal),
  };
}

export async function bulkDeleteTransactions(transactionIds: string[]) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: { id: { in: transactionIds }, userId: user.id },
      select: { id: true, amount: true, type: true, accountId: true },
    });

    if (transactions.length === 0) {
      return { success: true }; // nothing to delete
    }

    // Track affected account IDs and balance deltas
    const accountBalanceChanges: Record<string, number> = {};
    for (const t of transactions) {
      const raw = Number(t.amount);
      // 👇 Fix sign: EXPENSE should DECREASE balance, INCOME should INCREASE
      const delta = t.type === "EXPENSE" ? -raw : raw;
      accountBalanceChanges[t.accountId] =
        (accountBalanceChanges[t.accountId] ?? 0) + delta;
    }

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.transaction.deleteMany({
        where: { id: { in: transactionIds }, userId: user.id },
      });

      for (const [accId, change] of Object.entries(accountBalanceChanges)) {
        await tx.account.update({
          where: { id: accId },
          data: { balance: { increment: change } },
        });
      }
    });
    revalidateTag("transactions");
    for (const accId of Object.keys(accountBalanceChanges)) {
      revalidateTag(`account:${accId}`);
    }


    return { success: true, affectedAccounts: Object.keys(accountBalanceChanges) };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Unknown error in bulkDeleteTransactions");
    return { success: false, error: error.message };
  }
}

export async function updateDefaultAccount(accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await db.account.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard", "page"); // ✅ add "page"

    return { success: true, data: serializeDecimal(account) };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Unknown error in updateDefaultAccount");
    return { success: false, error: error.message };
  }
}