import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 🤓 Utiliser une instance globale de PrismaClient pour éviter les connexions multiples en développement
// 📜 Documentation: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/instantiate-prisma-client
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  prismaPool: Pool;
};

const pool =
  globalForPrisma.prismaPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

globalForPrisma.prisma = prisma;
globalForPrisma.prismaPool = pool;

export default prisma;
