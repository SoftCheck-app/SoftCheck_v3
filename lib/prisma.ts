import { PrismaClient } from '@prisma/client';
import employeeExtension from '../models/employee';
import softwareDatabaseExtension from '../models/softwareDatabase';

// PrismaClient with custom extensions
const prismaClientSingleton = () => {
  return new PrismaClient()
    .$extends(employeeExtension)
    .$extends(softwareDatabaseExtension);
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
