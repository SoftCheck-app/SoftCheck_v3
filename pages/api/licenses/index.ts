import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

// Inicializar cliente de Prisma
const prisma = new PrismaClient();

/**
 * API Route para gestionar licencias
 * 
 * GET: Obtener lista de licencias con estadísticas
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

      // Obtener las licencias
      const licenses = await prisma.licenseDatabase.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        orderBy,
      });

      // Calcular estadísticas
      const activeLicensesCount = await prisma.licenseDatabase.count({
        where: { status: 'active' },
      });

      // Calcular el costo total mensual de las licencias activas
      const activeLicenses = await prisma.licenseDatabase.findMany({
        where: { status: 'active' },
        select: { price: true },
      });
      
      const totalMonthlyCost = activeLicenses.reduce(
        (sum, license) => sum + license.price, 
        0
      );

      // Obtener el número de licencias que vencen en los próximos 30 días
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const nextRenewalCount = await prisma.licenseDatabase.count({
        where: {
          status: 'active',
          expirationDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow,
          },
        },
      });

      // Obtener el número de licencias programadas para cancelación
      const scheduledCancellationCount = await prisma.licenseDatabase.count({
        where: { status: 'pending_cancellation' },
      });

      // Función para determinar el tipo de plan basado en el precio
      const getPlanType = (price: number): string => {
        if (price <= 10) return 'Basic';
        if (price <= 25) return 'Pro';
        if (price <= 50) return 'Team';
        return 'Enterprise';
      };

      // Transformar los datos para el frontend
      const transformedLicenses = licenses.map(license => ({
        id: license.id,
        software: license.softwareName,
        planType: getPlanType(license.price),
        requestedBy: license.user?.name || 'Unknown',
        assignedTo: license.user?.name || 'Unassigned',
        date: license.activationDate ? new Date(license.activationDate).toLocaleDateString() : 'N/A',
        renewalDate: license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : 'N/A',
        price: license.price,
        status: license.status,
      }));

      // Devolver datos y estadísticas
      return res.status(200).json({
        licenses: transformedLicenses,
        stats: {
          activeLicenses: activeLicensesCount,
          nextRenewal: nextRenewalCount,
          scheduledCancellation: scheduledCancellationCount,
          totalMonthlyCost: totalMonthlyCost,
        }
      });
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