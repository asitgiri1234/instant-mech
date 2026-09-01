import { PrismaClient } from "@prisma/client";

/**
 * Single client for the process. Re-created modules under `tsx watch` would
 * otherwise open a new connection pool on every reload.
 */
export const prisma: PrismaClient =
  (globalThis as { __prisma?: PrismaClient }).__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  (globalThis as { __prisma?: PrismaClient }).__prisma = prisma;
}
