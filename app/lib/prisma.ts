//Creates one shared Prisma client for the whole app (prevents too many DB connections in dev)
// Prisma 7 requires a driver adapter — the connection URL is no longer read from schema.prisma
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

// Reset global cached client in dev mode if schema changed
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = undefined;
}

export const prisma =
    globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;