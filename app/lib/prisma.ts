//Creates one shared Prisma client for the whole app (prevents too many DB connections in dev)
// Prisma 7 requires a driver adapter — the connection URL is no longer read from schema.prisma
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
    const url = process.env.DATABASE_URL || "";
    if (url && !url.includes("allowPublicKeyRetrieval")) {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}allowPublicKeyRetrieval=true`;
    }
    return url;
}

function createPrismaClient(): PrismaClient {
    const adapter = new PrismaMariaDb(getDatabaseUrl());
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}