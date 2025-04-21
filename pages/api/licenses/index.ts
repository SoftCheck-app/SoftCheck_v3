import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API Route para gestionar licencias
 * 
 * GET: Obtener lista de licencias
 * POST: Añadir nueva licencia
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // GET: Obtener lista de licencias
  if (req.method === 'GET') {
    try {
      const { status, softwareName, userId } = req.query;

      let whereClause: any = {};
      
      // Filtrar por estado
      if (status) {
        whereClause.status = status;
      }

      // Buscar por nombre de software
      if (softwareName) {
        whereClause.softwareName = {
          contains: softwareName as string,
          mode: 'insensitive',
        };
      }

      // Filtrar por usuario
      if (userId) {
        whereClause.userId = userId;
      }

      const licenses = await prisma.licenseDatabase.findMany({
        where: whereClause,
        include: {
          user: true,
          softwareInstalls: true,
        },
        orderBy: {
          expirationDate: 'asc',
        },
      });

      return res.status(200).json(licenses);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      return res.status(500).json({ message: 'Error fetching licenses', error });
    }
  }

  // POST: Añadir nueva licencia
  if (req.method === 'POST') {
    try {
      const { 
        userId, 
        softwareName, 
        activationDate,
        expirationDate,
        price,
        status 
      } = req.body;

      const newLicense = await prisma.licenseDatabase.create({
        data: {
          userId,
          softwareName,
          activationDate: activationDate ? new Date(activationDate) : new Date(),
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          price,
          status: status || 'active',
        },
      });

      return res.status(201).json(newLicense);
    } catch (error) {
      console.error('Error creating license:', error);
      return res.status(500).json({ message: 'Error creating license', error });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: 'Method not allowed' });
} 