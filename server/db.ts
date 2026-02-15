// ============================================================
// Oeconomia Explorer — Prisma Client Singleton
// ============================================================
// All server code imports { prisma } from here.
// Prevents multiple PrismaClient instances during hot-reload.
// ============================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Recursively convert BigInt values to strings for JSON storage.
 * Prisma JSON columns can't handle native BigInt.
 */
export function sanitizeForJson(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(sanitizeForJson);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = sanitizeForJson(val);
    }
    return result;
  }
  return obj;
}
