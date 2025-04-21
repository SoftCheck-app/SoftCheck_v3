import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API Route para gestionar el software
 * 
 * GET: Obtener lista de software
 * POST: Añadir nuevo software
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // GET: Obtener lista de software
  if (req.method === 'GET') {
    try {
      const { status, name, vendor } = req.query;

      let whereClause: any = {};
      
      // Filtrar por estado de aprobación
      if (status === 'approved') {
        whereClause.isApproved = true;
      } else if (status === 'unapproved') {
        whereClause.isApproved = false;
      }

      // Buscar por nombre de software
      if (name) {
        whereClause.softwareName = {
          contains: name as string,
          mode: 'insensitive',
        };
      }

      // Buscar por proveedor
      if (vendor) {
        whereClause.vendor = {
          contains: vendor as string,
          mode: 'insensitive',
        };
      }

      const software = await prisma.softwareDatabase.findMany({
        where: whereClause,
        include: {
          user: true,
          license: true,
        },
        orderBy: {
          softwareName: 'asc',
        },
      });

      return res.status(200).json(software);
    } catch (error) {
      console.error('Error fetching software:', error);
      return res.status(500).json({ message: 'Error fetching software', error });
    }
  }

  // POST: Añadir nuevo software
  if (req.method === 'POST') {
    try {
      const { 
        deviceId, 
        userId, 
        licenseId,
        softwareName, 
        version, 
        vendor, 
        installPath,
        isApproved,
        notes,
      } = req.body;

      const newSoftware = await prisma.softwareDatabase.create({
        data: {
          deviceId,
          userId,
          licenseId: licenseId || null,
          softwareName,
          version,
          vendor,
          installDate: new Date(),
          installPath,
          isApproved: isApproved || false,
          notes,
        },
      });

      return res.status(201).json(newSoftware);
    } catch (error) {
      console.error('Error creating software:', error);
      return res.status(500).json({ message: 'Error creating software', error });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: 'Method not allowed' });
} 