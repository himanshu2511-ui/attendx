import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes("placeholder")) {
    console.warn("Prisma: Using dummy client (missing DATABASE_URL)");
    return new PrismaClient();
  }

  try {
    // Standard pool config with SSL enabled (required for most cloud DBs like Neon)
    const pool = new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=disable") ? false : true
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("Prisma: Failed to initialize PostgreSQL adapter:", error);
    return new PrismaClient();
  }
}

// Ensure we use a singleton even in production to minimize connection overhead
// though in serverless this is less impactful, it prevents issues during module re-evals.
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

export const prisma = globalForPrisma.prisma!;
