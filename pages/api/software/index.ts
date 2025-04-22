import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

// Inicializar cliente de Prisma
const prisma = new PrismaClient();

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
      const { status, name, vendor, department, sortBy, sortOrder } = req.query;

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
      
      // Filtrar por departamento de usuario
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
        if (['softwareName', 'vendor', 'installDate', 'version'].includes(field)) {
          orderBy[field] = direction;
        }
      } else {
        // Orden predeterminado por nombre de software
        orderBy.softwareName = 'asc';
      }

      const software = await prisma.SoftwareDatabase.findMany({
        where: whereClause,
        include: {
          user: true,
          license: true,
        },
        orderBy,
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
        installMethod,
        isApproved,
        detectedBy,
        digitalSignature,
        sha256,
        notes,
      } = req.body;

      // Validación básica
      if (!deviceId || !userId || !softwareName || !version || !vendor || !installPath) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          requiredFields: ['deviceId', 'userId', 'softwareName', 'version', 'vendor', 'installPath']
        });
      }

      const newSoftware = await prisma.SoftwareDatabase.create({
        data: {
          deviceId,
          userId,
          licenseId: licenseId || null,
          softwareName,
          version,
          vendor,
          installDate: new Date(),
          installPath,
          installMethod: installMethod || 'Manual',
          lastExecuted: new Date(),
          isRunning: false,
          digitalSignature: digitalSignature || '',
          isApproved: isApproved || false,
          detectedBy: detectedBy || 'User',
          sha256: sha256 || '',
          notes,
        },
        include: {
          user: true,
          license: true,
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