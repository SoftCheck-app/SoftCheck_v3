import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';

// Inicializar cliente de Prisma
const prisma = new PrismaClient();

/**
 * Función para convertir la API key en un hash
 * @param apiKey API key en formato texto plano
 * @returns API key hasheada
 */
function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * @description API endpoint para obtener un ID de empleado de ejemplo
 * Utilizado principalmente para pruebas con scripts
 * 
 * GET: Devuelve un ID de empleado aleatorio
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir GET
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
      }
    });

    if (!validApiKey) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    // Buscar un empleado aleatorio 
    const employee = await prisma.employee.findFirst({
      select: {
        id: true
      }
    });

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'No employees found in the database' 
      });
    }

    // Devolver el ID del empleado
    return res.status(200).json({
      success: true,
      employeeId: employee.id
    });

  } catch (error) {
    console.error('Error fetching example employee ID:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
} 