import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

// Inicializar cliente de Prisma desde lib/prisma
import { prisma } from '@/lib/prisma';

/**
 * API Route para registrar software sin autenticación de sesión
 * Esta ruta es para uso interno en la aplicación web
 * 
 * POST: Añadir nuevo software
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
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
      teamId: bodyTeamId,
    } = req.body;

    // Validación básica
    if (!softwareName || !version || !vendor || !installPath) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        requiredFields: ['softwareName', 'version', 'vendor', 'installPath']
      });
    }

    // Obtener teamId desde el query parameter, header o body
    const teamId = req.query.teamId as string || req.headers['x-team-id'] as string || bodyTeamId;
    
    if (!teamId) {
      return res.status(400).json({ 
        message: 'Missing teamId parameter',
        error: 'teamId is required for software registration'
      });
    }

    // Buscar un usuario predeterminado (para software registrado manualmente)
    let defaultUser = await (prisma as any).employee.findFirst({
      where: {
        teamId: teamId,
        OR: [
          { email: 'admin@example.com' },
          { email: 'admin@softcheck.com' },
          { role: 'admin' }
        ]
      }
    });

    // Si no existe un usuario administrador, intentar crear uno automáticamente
    if (!defaultUser) {
      try {
        console.log('No admin user found, creating default admin user...');
        defaultUser = await (prisma as any).employee.create({
          data: {
            teamId: teamId,
            name: 'System Admin',
            email: 'admin@softcheck.com',
            department: 'IT',
            role: 'admin',
            status: 'active'
          }
        });
        console.log('Created default admin user with ID:', defaultUser.id);
      } catch (userError) {
        console.error('Failed to create default admin user:', userError);
        return res.status(500).json({ 
          message: 'Failed to create default admin user', 
          error: String(userError)
        });
      }
    }

    // Usar un ID fijo para el dispositivo
    const defaultDeviceId = "MANUAL-REG-DEVICE-001";

    try {
      // Crear el nuevo software
      const newSoftware = await (prisma as any).softwareDatabase.create({
        data: {
          teamId: teamId,
          deviceId: defaultDeviceId,
          userId: defaultUser.id,
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
          notes: notes || null,
        },
        include: {
          user: true,
        },
      });

      return res.status(201).json(newSoftware);
    } catch (dbError) {
      console.error('Error creating software record:', dbError);
      return res.status(500).json({ 
        message: 'Error creating software record', 
        error: String(dbError),
        details: {
          userId: defaultUser.id,
          deviceId: defaultDeviceId,
          softwareName,
          version
        }
      });
    }
  } catch (error) {
    console.error('Unexpected error in software registration:', error);
    return res.status(500).json({ 
      message: 'Unexpected error in software registration', 
      error: String(error)
    });
  }
} 