import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

// Importamos desde lib/prisma.ts para usar las extensiones
import { prisma } from '@/lib/prisma';

/**
 * API Route para obtener el conteo de instalaciones por software
 * 
 * GET: Obtener conteo de instalaciones agrupado por software
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // GET: Obtener conteo de instalaciones
  if (req.method === 'GET') {
    try {
      // Usar un enfoque más compatible con Prisma en lugar de SQL raw
      const software = await prisma.softwareDatabase.findMany({
        select: {
          softwareName: true,
          version: true,
        },
      });

      // Procesar los resultados para contar las instalaciones
      const installationCounts = software.reduce((counts, item) => {
        const key = `${item.softwareName}-${item.version}`;
        if (!counts[key]) {
          counts[key] = {
            softwareName: item.softwareName,
            version: item.version,
            installCount: 0
          };
        }
        counts[key].installCount += 1;
        return counts;
      }, {} as Record<string, { softwareName: string; version: string; installCount: number }>);

      // Convertir el objeto en un array
      const result = Object.values(installationCounts);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching software installation counts:', error);
      return res.status(500).json({ message: 'Error fetching installation counts', error });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: 'Method not allowed' });
} 