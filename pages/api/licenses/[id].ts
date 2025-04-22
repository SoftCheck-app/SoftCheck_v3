import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

// Inicializar cliente de Prisma
const prisma = new PrismaClient();

/**
 * API Route para gestionar una licencia específica por ID
 * 
 * GET: Obtener detalles de una licencia
 * PATCH: Actualizar una licencia
 * DELETE: Eliminar una licencia
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid license ID' });
  }

  // GET: Obtener una licencia específica
  if (req.method === 'GET') {
    try {
      const license = await prisma.licenseDatabase.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!license) {
        return res.status(404).json({ message: 'License not found' });
      }

      // Función para determinar el tipo de plan basado en el precio
      const getPlanType = (price: number): string => {
        if (price <= 10) return 'Basic';
        if (price <= 25) return 'Pro';
        if (price <= 50) return 'Team';
        return 'Enterprise';
      };

      // Transformar para el frontend
      const transformedLicense = {
        id: license.id,
        software: license.softwareName,
        planType: getPlanType(license.price),
        userId: license.userId,
        assignedTo: license.user?.name || 'Unassigned',
        activationDate: license.activationDate,
        expirationDate: license.expirationDate,
        price: license.price,
        status: license.status,
      };

      return res.status(200).json(transformedLicense);
    } catch (error) {
      console.error('Error fetching license:', error);
      return res.status(500).json({ message: 'Error fetching license', error });
    }
  }

  // PATCH: Actualizar una licencia
  if (req.method === 'PATCH') {
    try {
      const {
        softwareName,
        activationDate,
        expirationDate,
        price,
        status,
        userId
      } = req.body;

      // Verificar si la licencia existe
      const existingLicense = await prisma.licenseDatabase.findUnique({
        where: { id },
      });

      if (!existingLicense) {
        return res.status(404).json({ message: 'License not found' });
      }

      // Preparar los datos a actualizar
      const updateData: any = {};

      if (softwareName) updateData.softwareName = softwareName;
      if (activationDate) updateData.activationDate = new Date(activationDate);
      if (expirationDate) updateData.expirationDate = new Date(expirationDate);
      if (price !== undefined) updateData.price = parseFloat(price);
      if (status) updateData.status = status;
      if (userId) updateData.userId = userId;

      // Actualizar la licencia
      const updatedLicense = await prisma.licenseDatabase.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
        },
      });

      return res.status(200).json(updatedLicense);
    } catch (error) {
      console.error('Error updating license:', error);
      return res.status(500).json({ message: 'Error updating license', error });
    }
  }

  // DELETE: Eliminar una licencia
  if (req.method === 'DELETE') {
    try {
      // Verificar si la licencia existe
      const existingLicense = await prisma.licenseDatabase.findUnique({
        where: { id },
      });

      if (!existingLicense) {
        return res.status(404).json({ message: 'License not found' });
      }

      // Eliminar la licencia
      await prisma.licenseDatabase.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'License deleted successfully' });
    } catch (error) {
      console.error('Error deleting license:', error);
      return res.status(500).json({ message: 'Error deleting license', error });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: 'Method not allowed' });
} 