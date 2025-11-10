/**
 * Central Prisma client, tuned for the Supabase Postgres instance.
 *
 * Why this file exists:
 *   - Every API route can import `prisma` without worrying about instantiating a new client.
 *   - Prisma warns about exhausting database connections in development; the `globalThis`
 *     caching pattern side-steps that while keeping production safe.
 */
import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma =
  globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
