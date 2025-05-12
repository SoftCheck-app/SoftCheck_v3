import { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Función para convertir la API key en un hash
 * @param apiKey API key en formato texto plano
 * @returns API key hasheada
 */
function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * @description API endpoint para obtener la configuración del agente
 * 
 * GET: Obtener la configuración actual del agente para un equipo
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verificar API key en la cabecera
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'Missing API key' });
    }

    // Calcular hash de la API key para comparar con la almacenada
    const hashedApiKey = hashApiKey(apiKey);

    // Buscar la API key en la base de datos
    const validApiKey = await prisma.apiKey.findFirst({
      where: {
        hashedKey: hashedApiKey,
      },
      include: {
        team: true // Incluir los datos del equipo para acceder a las configuraciones del agente
      }
    });

    if (!validApiKey) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    // Actualizar fecha de último uso
    await prisma.apiKey.update({
      where: { id: validApiKey.id },
      data: { lastUsedAt: new Date() }
    });

    // Obtener el teamId del API key validada
    const teamId = validApiKey.teamId;

    // Obtener la configuración del agente para este equipo
    const agentSettings = await (prisma as any).agentSettings.findUnique({
      where: { teamId }
    });

    // Si no hay configuración específica, devolver valores predeterminados
    if (!agentSettings) {
      return res.status(200).json({
        isActive: true,
        isActiveMode: true,
        autoUpdate: true,
        teamId,
        lastUpdated: new Date()
      });
    }

    // Devolver la configuración del agente
    return res.status(200).json({
      isActive: agentSettings.isActive,
      isActiveMode: agentSettings.isActiveMode,
      autoUpdate: agentSettings.autoUpdate,
      teamId,
      lastUpdated: agentSettings.updatedAt
    });
  } catch (error) {
    console.error('Error retrieving agent settings:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
} 