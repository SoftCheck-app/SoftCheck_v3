import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

// Inicializar cliente de Prisma
const prisma = new PrismaClient();

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
      const { status, softwareName, userId, department, sortBy, sortOrder } = req.query;

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
      
      // Filtrar por departamento del usuario
      if (department) {
        whereClause.user = {
          department: {
            contains: department as string,
            mode: 'insensitive',
          }
        };
      }

      // Determinar el orden de clasificación
      const orderBy: any = {};
      if (sortBy) {
        const field = sortBy as string;
        const direction = sortOrder === 'desc' ? 'desc' : 'asc';
        
        // Solo permitir ordenar por campos específicos
        if (['softwareName', 'activationDate', 'expirationDate', 'price', 'status'].includes(field)) {
          orderBy[field] = direction;
        }
      } else {
        // Orden predeterminado por fecha de expiración
        orderBy.expirationDate = 'asc';
      }

      const licenses = await prisma.licenseDatabase.findMany({
        where: whereClause,
        include: {
          user: true,
          software: true,
        },
        orderBy,
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

      // Validación básica
      if (!userId || !softwareName || !price) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          requiredFields: ['userId', 'softwareName', 'price']
        });
      }

      const newLicense = await prisma.licenseDatabase.create({
        data: {
          userId,
          softwareName,
          activationDate: activationDate ? new Date(activationDate) : new Date(),
          expirationDate: expirationDate ? new Date(expirationDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          price: parseFloat(price),
          status: status || 'active',
        },
        include: {
          user: true,
          software: true,
        }
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