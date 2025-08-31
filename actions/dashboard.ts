"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";;

/**
 * Safely serializes money-like fields that might be Prisma.Decimal or number.
 * Preserves zero values and works whether the field is Decimal or number.
 */
const serializeTransaction = <T extends Record<string, unknown>>(obj: T) => {
  const serialized: Record<string, unknown> = { ...obj };

  // Use != null so 0 is not skipped
  if ((obj as any)?.balance != null) {
    serialized.balance = Number((obj as any).balance);
  }
  if ((obj as any)?.amount != null) {
    serialized.amount = Number((obj as any).amount);
  }
  return serialized as T & { balance?: number; amount?: number };
};

type CreateAccountInput = {
  name?: string;
  // Add any other fields your Account model accepts:
  // e.g. type?: string; institution?: string; accountNumber?: string;
  balance: number | string;   // comes from form as string or number
  isDefault?: boolean;
  [key: string]: unknown;     // allow extra fields that map to your model
};

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Returns the current user's accounts, newest first, with serialized numeric fields.
 */
export async function getUserAccounts(): Promise<ReturnType<typeof serializeTransaction>[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  try {
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    return accounts.map(serializeTransaction);
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Failed to fetch accounts");
    console.error(error);
    throw error;
  }
}

/**
 * Creates an account with optional default-account logic and rate-limiting via Arcjet.
 * Returns a serialized account on success.
 */
export async function createAccount(data: CreateAccountInput): Promise<ActionResult<ReturnType<typeof serializeTransaction>>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Gather request context for Arcjet (rate limiting)
    const req = await request();

    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason?.isRateLimit?.()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: { remaining, resetInSeconds: reset },
        });
        return { success: false, error: "Too many requests. Please try again later." };
      }
      return { success: false, error: "Request blocked" };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Normalize balance to a number
    const balanceNum = typeof data.balance === "string" ? Number(data.balance) : Number(data.balance);
    if (Number.isNaN(balanceNum)) {
      return { success: false, error: "Invalid balance amount" };
    }

    // Check if this is the user's first account
    const existingAccountsCount = await db.account.count({
      where: { userId: user.id },
    });

    // First account is always default; otherwise, respect the user's choice
    const shouldBeDefault = existingAccountsCount === 0 ? true : Boolean(data.isDefault);

    // If this account should be default, unset other defaults
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account
    const { balance, isDefault, ...rest } = data; // avoid duplicating normalized fields
    const account = await db.account.create({
      data: {
        ...rest,
        userId: user.id,
        balance: balanceNum,      // Prisma Decimal or number accepted by client
        isDefault: shouldBeDefault,
      } as any, // cast to any to allow extra optional fields from CreateAccountInput
    });

    const serializedAccount = serializeTransaction(account);

    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error while creating account");
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Returns all transactions for the current user (sorted newest first),
 * with money fields serialized to plain numbers.
 */
export async function getDashboardData(): Promise<ReturnType<typeof serializeTransaction>[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}