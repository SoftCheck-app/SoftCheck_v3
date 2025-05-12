import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthOptions } from '@/lib/nextAuth';

// Define tipos para respuesta y entrada
type AgentStatus = {
  isActive: boolean;
  isActiveMode: boolean;
  autoUpdate: boolean;
  teamId: string;
  lastUpdated?: Date;
};

// API para gestionar el estado del agente
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Obtener la sesión del servidor
  const authOptions = getAuthOptions(req, res);
  const session = await getServerSession(req, res, authOptions);
  
  // Verificar autenticación
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { teamId } = req.query;

  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Team ID is required' });
  }

  // Verificar permiso del usuario al equipo
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      teamId: teamId,
      userId: session.user.id,
    },
  });

  if (!teamMember) {
    return res.status(403).json({ error: 'You do not have access to this team' });
  }

  // GET: Obtener estado actual
  if (req.method === 'GET') {
    try {
      // Obtener la configuración del agente o usar valores predeterminados
      // Usamos 'as any' hasta que se ejecute la migración
      const settings = await (prisma as any).agentSettings.findUnique({
        where: {
          teamId,
        },
      });

      if (!settings) {
        // Si no existen configuraciones, devolver valores predeterminados
        return res.status(200).json({
          isActive: true,
          isActiveMode: true,
          autoUpdate: true,
          teamId,
          lastUpdated: new Date(),
        });
      }

      return res.status(200).json({
        isActive: settings.isActive,
        isActiveMode: settings.isActiveMode,
        autoUpdate: settings.autoUpdate,
        teamId,
        lastUpdated: settings.updatedAt,
      });
    } catch (error) {
      console.error('Error getting agent settings:', error);
      return res.status(500).json({ error: 'Error retrieving agent settings' });
    }
  }

  // POST: Actualizar estado
  if (req.method === 'POST') {
    try {
      const { isActive, isActiveMode, autoUpdate } = req.body;

      // Validar los datos recibidos
      if (typeof isActive !== 'undefined' && typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }
      
      if (typeof isActiveMode !== 'undefined' && typeof isActiveMode !== 'boolean') {
        return res.status(400).json({ error: 'isActiveMode must be a boolean' });
      }
      
      if (typeof autoUpdate !== 'undefined' && typeof autoUpdate !== 'boolean') {
        return res.status(400).json({ error: 'autoUpdate must be a boolean' });
      }
      
      // Verificar si ya existe una configuración para este equipo
      // Usamos 'as any' hasta que se ejecute la migración
      const existingSettings = await (prisma as any).agentSettings.findUnique({
        where: {
          teamId,
        },
      });
      
      let settings;
      
      if (existingSettings) {
        // Actualizar configuración existente
        settings = await (prisma as any).agentSettings.update({
          where: {
            id: existingSettings.id,
          },
          data: {
            isActive: isActive !== undefined ? isActive : existingSettings.isActive,
            isActiveMode: isActiveMode !== undefined ? isActiveMode : existingSettings.isActiveMode,
            autoUpdate: autoUpdate !== undefined ? autoUpdate : existingSettings.autoUpdate,
          },
        });
      } else {
        // Crear nueva configuración
        settings = await (prisma as any).agentSettings.create({
          data: {
            teamId,
            isActive: isActive !== undefined ? isActive : true,
            isActiveMode: isActiveMode !== undefined ? isActiveMode : true,
            autoUpdate: autoUpdate !== undefined ? autoUpdate : true,
          },
        });
      }

      return res.status(200).json({
        isActive: settings.isActive,
        isActiveMode: settings.isActiveMode,
        autoUpdate: settings.autoUpdate,
        teamId,
        lastUpdated: settings.updatedAt,
      });
    } catch (error) {
      console.error('Error updating agent settings:', error);
      return res.status(500).json({ error: 'Error updating agent settings' });
    }
  }

  // Método no permitido
  return res.status(405).json({ error: 'Method not allowed' });
} 