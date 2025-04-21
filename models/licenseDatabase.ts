import { Prisma } from '@prisma/client';

const licenseDatabaseExtension = Prisma.defineExtension((prisma) => {
  return prisma.$extends({
    model: {
      licenseDatabase: {
        /**
         * Find licenses by software name
         */
        findBySoftwareName(softwareName: string) {
          return prisma.licenseDatabase.findMany({
            where: {
              softwareName: {
                contains: softwareName,
                mode: 'insensitive',
              },
            },
          });
        },

        /**
         * Find licenses assigned to a specific user
         */
        findByUser(userId: string) {
          return prisma.licenseDatabase.findMany({
            where: {
              userId,
            },
            include: {
              user: true,
            },
          });
        },

        /**
         * Find active licenses
         */
        findActive() {
          return prisma.licenseDatabase.findMany({
            where: {
              status: 'active',
            },
            include: {
              user: true,
            },
          });
        },

        /**
         * Find expired licenses
         */
        findExpired() {
          return prisma.licenseDatabase.findMany({
            where: {
              status: 'expired',
            },
          });
        },

        /**
         * Find licenses expiring soon (within 30 days)
         */
        findExpiringSoon() {
          const today = new Date();
          const thirtyDaysFromNow = new Date(today);
          thirtyDaysFromNow.setDate(today.getDate() + 30);

          return prisma.licenseDatabase.findMany({
            where: {
              status: 'active',
              expirationDate: {
                lte: thirtyDaysFromNow,
                gt: today,
              },
            },
            include: {
              user: true,
            },
            orderBy: {
              expirationDate: 'asc',
            },
          });
        },
      },
    },
  });
});

export default licenseDatabaseExtension; 