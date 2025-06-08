import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import type { NextApiRequest, NextApiResponse } from 'next';

interface RiskSettings {
  riskAppetite: number;
  lastUpdated?: Date;
  teamId: string;
}

/**
 * API Route para gestionar configuraciones de riesgo por equipo
 * 
 * GET: Obtener configuración de riesgo del equipo
 * POST: Actualizar configuración de riesgo del equipo
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

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Team slug is required' });
  }

  // Obtener el equipo por slug
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  // Verificar que el usuario es miembro del equipo
  if (team.members.length === 0) {
    return res.status(403).json({ message: 'You do not have access to this team' });
  }

  // GET: Obtener configuración de riesgo
  if (req.method === 'GET') {
    try {
      // Por ahora, devolvemos configuración por defecto ya que no tenemos tabla específica
      // En el futuro se podría crear una tabla RiskSettings
      return res.status(200).json({
        riskAppetite: 50, // Valor por defecto
        lastUpdated: new Date(),
        teamId: team.id,
      });
    } catch (error) {
      console.error('Error fetching risk settings:', error);
      return res.status(500).json({ message: 'Error fetching risk settings', error });
    }
  }

  // POST: Actualizar configuración de riesgo
  if (req.method === 'POST') {
    try {
      const { riskAppetite } = req.body;

      // Validación básica
      if (typeof riskAppetite !== 'number' || riskAppetite < 0 || riskAppetite > 100) {
        return res.status(400).json({ 
          message: 'Invalid risk appetite value. Must be a number between 0 and 100.' 
        });
      }

      // Por ahora, simplemente devolvemos la configuración actualizada
      // En el futuro se podría guardar en una tabla RiskSettings
      return res.status(200).json({
        riskAppetite,
        lastUpdated: new Date(),
        teamId: team.id,
      });
    } catch (error) {
      console.error('Error updating risk settings:', error);
      return res.status(500).json({ message: 'Error updating risk settings', error });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: 'Method not allowed' });
} 