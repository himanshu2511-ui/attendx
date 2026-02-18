import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const adapter = new PrismaPg({ connectionString });
    prismaInstance = new PrismaClient({ adapter });
  } else {
    // Falls back to standard PrismaClient if connectionString is missing during build
    // This allows the build to proceed even if env var isn't in build environment
    prismaInstance = new PrismaClient();
  }
} else {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      const adapter = new PrismaPg({ connectionString });
      globalForPrisma.prisma = new PrismaClient({ adapter });
    } else {
      globalForPrisma.prisma = new PrismaClient();
    }
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
