import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const database = globalThis as typeof globalThis & {
  rentalDatabase?: PrismaClient;
};
/** Open a database connection only when a server operation needs it. */
export function getDatabase(): PrismaClient {
  if (database.rentalDatabase) return database.rentalDatabase;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error("DATABASE_URL is required for backend services.");
  const adapter = new PrismaPg({
    connectionString,
    max: process.env.DATABASE_POOL_SIZE === "1" ? 1 : 10,
    connectionTimeoutMillis: 5000,
  });
  database.rentalDatabase = new PrismaClient({ adapter });
  return database.rentalDatabase;
}
