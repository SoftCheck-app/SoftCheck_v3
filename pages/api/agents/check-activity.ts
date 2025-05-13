import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import checkAgentActivity from '../../../scripts/check-agent-activity';

// Función para convertir la API key en un hash
function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

type ResponseData = {
  success: boolean;
  message: string;
  details?: any;
};

/**
 * @description API endpoint para verificar y actualizar el estado de actividad de los agentes
 * 
 * GET: Ejecuta la verificación de actividad de los agentes y actualiza su estado
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
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
    const { prisma } = await import('@/lib/prisma');
    const validApiKey = await prisma.apiKey.findFirst({
      where: {
        hashedKey: hashedApiKey,
      }
    });

    if (!validApiKey) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    // Ejecutar la verificación de actividad
    await checkAgentActivity();

    // Responder con éxito
    return res.status(200).json({
      success: true,
      message: 'Agent activity check completed successfully',
    });
  } catch (error) {
    console.error('Error checking agent activity:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error'
    });
  }
} 