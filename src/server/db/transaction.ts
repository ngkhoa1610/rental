import "server-only";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";

/** Callback must contain DB work only; retries must not duplicate external effects. */
export async function serializable<T>(
  db: PrismaClient,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: "Serializable",
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code);
      if (!retryable || attempt >= 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }
}

/** Lock in stable order before checking overlapping rentals and inventory blocks. */
export async function lockProducts(
  tx: Prisma.TransactionClient,
  productIds: readonly string[],
): Promise<void> {
  const ids = [...new Set(productIds)].sort();
  if (!ids.length) return;
  await tx.$queryRaw(
    Prisma.sql`SELECT "id" FROM "Product" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`,
  );
}
