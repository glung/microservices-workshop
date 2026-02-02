import { PrismaClient } from "@prisma/client";

// 🤓 Utiliser une instance globale de PrismaClient pour éviter les connexions multiples en développement
// 📜 Documentation: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/instantiate-prisma-client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
