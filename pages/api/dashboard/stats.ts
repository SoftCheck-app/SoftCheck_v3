import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API Route para obtener estadísticas para el dashboard
 * 
 * GET: Obtener estadísticas del dashboard
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Solo permitimos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Obtenemos el primer día del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Calculamos las estadísticas
    const [
      totalSoftware,
      activeLicenses,
      licenses,
      totalEmployees,
      softwareApprovedThisMonth
    ] = await Promise.all([
      // Total Software
      prisma.softwareDatabase.count(),
      
      // Licencias activas
      prisma.licenseDatabase.count({
        where: {
          status: 'active',
        },
      }),
      
      // Todas las licencias para calcular coste mensual
      prisma.licenseDatabase.findMany({
        where: {
          status: 'active',
        },
        select: {
          price: true,
        },
      }),
      
      // Total de empleados
      prisma.employee.count({
        where: {
          status: 'active',
        },
      }),
      
      // Software aprobado este mes
      prisma.softwareDatabase.count({
        where: {
          isApproved: true,
          installDate: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    // Calculamos el coste mensual
    const monthlyCost = licenses.reduce((total, license) => {
      return total + Number(license.price);
    }, 0);

    // Calculamos el coste medio por empleado
    const avgCostPerEmployee = totalEmployees > 0
      ? Number((monthlyCost / totalEmployees).toFixed(2))
      : 0;

    return res.status(200).json({
      totalSoftware,
      activeLicenses,
      monthlyCost,
      avgCostPerEmployee,
      totalEmployees,
      softwareApprovedThisMonth,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Error fetching dashboard stats', error });
  }
} 