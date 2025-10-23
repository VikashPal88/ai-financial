"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";
import type { Prisma, TransactionType, TransactionStatus } from "@prisma/client";
import { randomUUID } from "crypto"; // safer than global crypto.randomUUID()

// Replace with real IDs or pass as parameters when calling the action
const ACCOUNT_ID: string = "account-id";
const USER_ID: string = "user-id";

type CategorySpec = { name: string; range: [number, number] };

// Categories with their typical amount ranges
const CATEGORIES: Record<TransactionType, CategorySpec[]> = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

// Helper to generate random amount within a range
function getRandomAmount(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Helper to get random category with amount
function getRandomCategory(
  type: TransactionType
): { category: string; amount: number } {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions(
  accountId: string = ACCOUNT_ID,
  userId: string = USER_ID
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Generate 90 days of transactions
    const transactions: Prisma.TransactionCreateManyInput[] = [];
    let totalBalance = 0; // For exact decimal precision, see note below.

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);

      // Generate 1-3 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        // 40% income, 60% expense
        const type: TransactionType = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);
        const status: TransactionStatus = "COMPLETED";

        transactions.push({
          id: randomUUID(),
          type,                 // Prisma enum type
          amount,               // Prisma Decimal or number; number is accepted as input
          description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
          date,
          category,
          status,               // Prisma enum type
          userId: userId,
          accountId: accountId,
          createdAt: date,
          updatedAt: date,
        });

        totalBalance += type === "INCOME" ? amount : -amount;
      }
    }

    // Insert transactions in batches and update account balance
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clear existing transactions for this account
      await tx.transaction.deleteMany({
        where: { accountId },
      });

      // Insert new transactions
      await tx.transaction.createMany({
        data: transactions,
        // skipDuplicates: true, // uncomment if you might re-run with same IDs
      });

      // Update account balance
      await tx.account.update({
        where: { id: accountId },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown seeding error");
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}