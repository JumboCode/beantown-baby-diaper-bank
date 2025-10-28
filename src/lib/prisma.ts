/**
 * Central Prisma client, tuned for the Supabase Postgres instance.
 *
 * Why this file exists:
 *   - Every API route can import `prisma` without worrying about instantiating a new client.
 *   - Prisma warns about exhausting database connections in development; the `globalThis`
 *     caching pattern side-steps that while keeping production safe.
 */
import { PrismaClient } from "../generated/prisma/client";

/**
 * Extend the global type definition so TypeScript knows we stash the client there in dev.
 * This mirrors the official Prisma with Next.js recipe.
 */
declare global {
  // eslint-disable-next-line no-var -- required for declaration merging on globalThis
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
