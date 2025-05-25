import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

// Importamos desde lib/prisma.ts para usar las extensiones
import { prisma } from '@/lib/prisma';

/**
 * API Route para obtener los usuarios que tienen instalado un software específico
 * 
 * GET: Obtener usuarios por software
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

  const { softwareName, version } = req.query;

  if (!softwareName) {
    return res.status(400).json({ message: 'Software name is required' });
  }

  try {
    // Definir condiciones de búsqueda básicas
    const whereCondition: { softwareName: string; version?: string } = {
      softwareName: softwareName as string
    };
    
    // Si se proporciona una versión específica, añadirla a las condiciones
    if (version) {
      whereCondition.version = version as string;
    }
    
    // Buscar software y usuarios relacionados
    const softwareInstances = await prisma.softwareDatabase.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          }
        }
      }
    });
    
    // Extraer y deduplicar usuarios (puede haber varios registros del mismo usuario)
    const userMap = new Map();
    softwareInstances.forEach(sw => {
      if (sw.user) {
        userMap.set(sw.user.id, sw.user);
      }
    });
    
    const users = Array.from(userMap.values());

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching software users:', error);
    return res.status(500).json({ message: 'Error fetching software users', error });
  }
} 