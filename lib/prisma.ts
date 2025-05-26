import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // Tu peux retirer ce log en production si nécessaire
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
