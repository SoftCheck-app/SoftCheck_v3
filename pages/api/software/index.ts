import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import type { NextApiRequest, NextApiResponse } from 'next';

// Inicializar cliente de Prisma
// Importamos desde lib/prisma.ts para usar las extensiones
import { prisma } from '@/lib/prisma';

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
  const authOptions = getAuthOptions(req, res);
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Obtener el teamId del usuario autenticado
  const teamId = req.query.teamId as string;
  
  if (!teamId) {
    return res.status(400).json({ 
      message: 'Missing teamId parameter',
      error: 'teamId is required to access team-specific data'
    });
  }

  // GET: Obtener lista de software
  if (req.method === 'GET') {
    try {
      const { status, name, vendor, department, sortBy, sortOrder } = req.query;

      let whereClause: any = {
        teamId: teamId  // Filtrar por equipo
      };
      
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

      const software = await (prisma as any).softwareDatabase.findMany({
        where: whereClause,
        include: {
          user: true,
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

      const newSoftware = await (prisma as any).softwareDatabase.create({
        data: {
          teamId: teamId,
          deviceId,
          userId,
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
        },
      });

      return res.status(201).json(newSoftware);
    } catch (error) {
      console.error('Error creating software:', error);
      return res.status(500).json({ message: 'Error creating software', error });
    }
  }

  // PUT: Actualizar software
  if (req.method === 'PUT') {
    try {
      const { 
        id,
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
        teamId
      } = req.body;

      // Validación básica
      if (!id || !softwareName || !version || !vendor || !installPath || !teamId) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          requiredFields: ['id', 'softwareName', 'version', 'vendor', 'installPath', 'teamId']
        });
      }

      // Verificar que el software existe y pertenece al equipo
      const existingSoftware = await (prisma as any).softwareDatabase.findFirst({
        where: {
          id,
          teamId: teamId as string
        },
      });

      if (!existingSoftware) {
        return res.status(404).json({ message: 'Software not found or does not belong to this team' });
      }

      const updatedSoftware = await (prisma as any).softwareDatabase.update({
        where: { id },
        data: {
          softwareName,
          version,
          vendor,
          installPath,
          installMethod: installMethod || 'Manual',
          isApproved: isApproved || false,
          detectedBy: detectedBy || 'User',
          digitalSignature: digitalSignature || '',
          sha256: sha256 || '',
          notes,
        },
        include: {
          user: true,
        },
      });

      return res.status(200).json(updatedSoftware);
    } catch (error) {
      console.error('Error updating software:', error);
      return res.status(500).json({ message: 'Error updating software', error });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: 'Method not allowed' });
} 