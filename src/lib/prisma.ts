import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // If we're here, it means prisma was accessed but DATABASE_URL is missing.
    // In production, we definitely need it. In development, we usually need it too.
    // However, return a standard client to avoid crashing if it's somehow accessed
    // inertly during a build phase that doesn't actually run queries.
    return new PrismaClient();
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Proxy-based lazy initialization
// This ensures createPrismaClient() is NEVER called until the code actually
// tries to access a property on the 'prisma' object (like prisma.user).
// This survives all of Next.js's static analysis during the build phase.
const prismaProxy = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop, receiver);
  }
});

export const prisma = prismaProxy;
