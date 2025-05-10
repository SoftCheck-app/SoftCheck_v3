import { prisma } from '@/lib/prisma';
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

    // Obtenemos software instalado recientemente
    const recentSoftware = await prisma.softwareDatabase.findMany({
      where: {
        installDate: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        installDate: 'desc',
      },
      take: 20,
    });

    // Convertimos software a formato de actividad
    const softwareActivities = recentSoftware.map(software => ({
      id: software.id,
      type: 'software_update',
      description: `${software.softwareName} - ${software.user?.name || 'Admin'}`,
      createdAt: software.installDate,
      userName: software.user?.name || 'Admin',
    }));

    // Tomamos solo las 10 más recientes
    const allActivities = softwareActivities.slice(0, 10);

    return res.status(200).json(allActivities);
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return res.status(500).json({ message: 'Error fetching activity summary', error });
  }
} 