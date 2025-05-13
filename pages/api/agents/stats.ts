import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthOptions } from '@/lib/nextAuth';
import { subHours, subMinutes } from 'date-fns';

type AgentStats = {
  activeAgents: number;
  inactiveAgents: number;
  totalAgents: number;
  lastSyncDate?: Date;
  recentlyActivated?: number;
  recentlyDeactivated?: number;
  agentVersions?: { [key: string]: number };
  agentsNeedingAttention?: number; // Nuevos agentes que no han pingueado en el último minuto
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  try {
    // Obtener todos los empleados con dispositivos registrados (tienen agente)
    const employeesWithAgents = await (prisma as any).employee.findMany({
      where: {
        deviceId: {
          not: null
        }
      }
    });
    
    // Total de agentes es igual al número de empleados con un deviceId
    const totalAgents = employeesWithAgents.length;
    
    // Define el límite de tiempo para considerar un agente como inactivo (1 minuto)
    const oneMinuteAgo = subMinutes(new Date(), 1);
    
    // Actualizar automáticamente el estado de empleados que no han pingeado en el último minuto
    await (prisma as any).employee.updateMany({
      where: {
        deviceId: {
          not: null
        },
        isActive: true,
        OR: [
          {
            lastPing: {
              lt: oneMinuteAgo
            }
          },
          {
            lastPing: null
          }
        ]
      },
      data: {
        isActive: false
      }
    });
    
    // Contar agentes activos después de la actualización automática
    const activeAgents = await (prisma as any).employee.count({
      where: {
        deviceId: {
          not: null
        },
        isActive: true,
        lastPing: {
          gte: oneMinuteAgo
        }
      }
    });
    
    // Contar agentes inactivos (tienen deviceId pero no han pingueado en el último minuto)
    const inactiveAgents = await (prisma as any).employee.count({
      where: {
        deviceId: {
          not: null
        },
        OR: [
          {
            isActive: false
          },
          {
            lastPing: {
              lt: oneMinuteAgo
            }
          },
          {
            lastPing: null
          }
        ]
      }
    });
    
    // Obtener la fecha del último ping
    const latestPing = await (prisma as any).employee.findFirst({
      where: {
        lastPing: {
          not: null
        }
      },
      orderBy: {
        lastPing: 'desc'
      },
      select: {
        lastPing: true
      }
    });
    
    // Calcular agentes recientemente activados (últimas 24 horas)
    const twentyFourHoursAgo = subHours(new Date(), 24);
    
    const recentlyActivated = await (prisma as any).employee.count({
      where: {
        deviceId: {
          not: null
        },
        isActive: true,
        lastPing: {
          gte: twentyFourHoursAgo
        }
      }
    });
    
    // Calcular agentes recientemente desactivados (últimas 24 horas)
    const recentlyDeactivated = await (prisma as any).employee.count({
      where: {
        deviceId: {
          not: null
        },
        isActive: false,
        lastPing: {
          gte: twentyFourHoursAgo
        }
      }
    });
    
    // Agentes que necesitan atención: activos en la BD pero sin ping reciente
    const agentsNeedingAttention = await (prisma as any).employee.count({
      where: {
        deviceId: {
          not: null
        },
        isActive: true,
        OR: [
          {
            lastPing: {
              lt: oneMinuteAgo
            }
          },
          {
            lastPing: null
          }
        ]
      }
    });
    
    const stats: AgentStats = {
      activeAgents,
      inactiveAgents,
      totalAgents,
      lastSyncDate: latestPing?.lastPing,
      recentlyActivated,
      recentlyDeactivated,
      agentVersions: {
        "1.0.0": activeAgents // Simplificado - en una implementación real obtendríamos las versiones reales
      },
      agentsNeedingAttention
    };
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching agent statistics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 