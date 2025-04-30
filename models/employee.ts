import { Prisma } from '@prisma/client';

const employeeExtension = Prisma.defineExtension((prisma) => {
  return prisma.$extends({
    model: {
      employee: {
        /**
         * Find employees by department
         */
        findByDepartment(department: string) {
          return prisma.employee.findMany({
            where: {
              department,
            },
          });
        },

        /**
         * Find employees by role
         */
        findByRole(role: string) {
          return prisma.employee.findMany({
            where: {
              role,
            },
          });
        },

        /**
         * Find employees with active status
         */
        findActive() {
          return prisma.employee.findMany({
            where: {
              status: 'active',
            },
          });
        },

        /**
         * Find employees with assigned software licenses
         * Corrección: Cambiado de assignedLicenses a licenses
         */
        findWithLicenses() {
          return prisma.employee.findMany({
            include: {
              licenses: true,
            },
          });
        },
      },
    },
  });
});

export default employeeExtension;