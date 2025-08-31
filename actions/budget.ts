"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Get current budget for the user and current month's expenses for a specific account
 */
export async function getCurrentBudget(accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Get current month's expenses
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
      _sum: {
        amount: true,
      },
    });

    // Use Number(...) so it works for both Prisma.Decimal and number
    return {
      budget: budget
        ? { ...budget, amount: Number(budget.amount) }
        : null,
      currentExpenses: Number(expenses._sum.amount ?? 0),
    };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Unknown error fetching budget");
    console.error("Error fetching budget:", error);
    throw error;
  }
}

/**
 * Update or create user's budget (amount can be number or string)
 */
export async function updateBudget(amount: number | string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Normalize amount to a number. If your schema uses Decimal, Prisma accepts number|string too.
    const normalizedAmount =
      typeof amount === "string" ? Number(amount) : Number(amount);

    if (Number.isNaN(normalizedAmount)) {
      throw new Error("Invalid amount");
    }

    // Update or create budget
    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount: normalizedAmount,
      },
      create: {
        userId: user.id,
        amount: normalizedAmount,
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: Number(budget.amount) },
    };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Unknown error updating budget");
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}