import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API Route para obtener actividades recientes para el dashboard
 * 
 * GET: Obtener actividades recientes
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
    // Obtenemos las últimas 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Obtenemos las diferentes actividades para combinarlas después
    const [newLicenses, updatedSoftware] = await Promise.all([
      // Nuevas licencias agregadas
      prisma.licenseDatabase.findMany({
        where: {
          activationDate: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          activationDate: 'desc',
        },
        take: 10,
      }),
      
      // Software actualizado recientemente
      prisma.softwareDatabase.findMany({
        where: {
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 10,
      }),
    ]);

    // Convertimos licencias a formato de actividad
    const licenseActivities = newLicenses.map(license => ({
      id: license.id,
      type: 'license_added',
      description: `${license.softwareName} - ${license.user?.name || 'Sin asignar'}`,
      createdAt: license.activationDate,
      user: license.user,
    }));

    // Convertimos software a formato de actividad
    const softwareActivities = updatedSoftware.map(software => ({
      id: software.id,
      type: 'software_update',
      description: `${software.softwareName} - ${software.user?.name || 'Admin'}`,
      createdAt: software.updatedAt,
      user: software.user,
    }));

    // Combinamos todas las actividades y ordenamos por fecha
    const allActivities = [...licenseActivities, ...softwareActivities]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10); // Tomamos solo las 10 más recientes

    return res.status(200).json(allActivities);
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return res.status(500).json({ message: 'Error fetching activity summary', error });
  }
} 