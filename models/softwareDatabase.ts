import { Prisma } from '@prisma/client';

// SoftwareDatabase model definition
const softwareDatabaseExtension = Prisma.defineExtension((prisma) => {
  return prisma.$extends({
    model: {
      softwareDatabase: {
        /**
         * Find software installations by software name
         */
        findBySoftwareName(softwareName: string) {
          return prisma.softwareDatabase.findMany({
            where: {
              softwareName: {
                contains: softwareName,
                mode: 'insensitive',
              },
            },
          });
        },

        /**
         * Find software installed by a specific user
         */
        findByUser(userId: string) {
          return prisma.softwareDatabase.findMany({
            where: {
              userId,
            },
            include: {
              user: true,
              license: true,
            },
          });
        },

        /**
         * Find software by approval status
         */
        findByApprovalStatus(isApproved: boolean) {
          return prisma.softwareDatabase.findMany({
            where: {
              isApproved,
            },
            include: {
              user: true,
              license: true,
            },
          });
        },

        /**
         * Find recently installed software (last 30 days)
         */
        findRecentlyInstalled() {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          return prisma.softwareDatabase.findMany({
            where: {
              installDate: {
                gte: thirtyDaysAgo,
              },
            },
            orderBy: {
              installDate: 'desc',
            },
            include: {
              user: true,
            },
          });
        },

        /**
         * Find running software
         */
        findRunning() {
          return prisma.softwareDatabase.findMany({
            where: {
              isRunning: true,
            },
            include: {
              user: true,
            },
          });
        },
      },
    },
  });
});

export default softwareDatabaseExtension; 