import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';

// Función para convertir la API key en un hash
function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

type PingRequest = {
  deviceId: string;
  employeeEmail?: string;
  status?: string;
};

type PingResponse = {
  success: boolean;
  message: string;
  shouldUpdate?: boolean;
  timestamp?: string;
};

/**
 * @description API endpoint para que los agentes actualicen su estado de actividad
 * 
 * POST: Recibe un ping de un agente y actualiza su estado
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PingResponse>
) {
  if (req.method !== 'POST') {
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

    // Buscar la API key en la base de datos con información del team
    const validApiKey = await prisma.apiKey.findFirst({
      where: {
        hashedKey: hashedApiKey,
      },
      include: {
        team: true
      }
    });

    if (!validApiKey) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    // Obtener el teamId desde la API key
    const teamId = validApiKey.teamId;

    // Actualizar fecha de último uso
    await prisma.apiKey.update({
      where: { id: validApiKey.id },
      data: { lastUsedAt: new Date() }
    });

    // Validar datos recibidos
    const { deviceId, employeeEmail, status } = req.body as PingRequest;

    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: deviceId'
      });
    }

    // Obtener la fecha y hora actual
    const currentTime = new Date();

    // Buscar el empleado por email o por deviceId dentro del team correcto
    let employee: any = null;
    
    if (employeeEmail) {
      employee = await (prisma as any).employee.findFirst({
        where: { 
          email: employeeEmail,
          teamId: teamId  // Filtrar por el team de la API key
        }
      });
    }
    
    if (!employee && deviceId) {
      // Si no se encontró por email, buscar por deviceId dentro del team
      employee = await (prisma as any).employee.findFirst({
        where: { 
          deviceId: deviceId,
          teamId: teamId  // Filtrar por el team de la API key
        }
      });
    }

    if (!employee) {
      console.log(`No se encontró empleado para deviceId: ${deviceId}, email: ${employeeEmail}`);
      
      // Intentamos crear un registro para este dispositivo con un email genérico
      try {
        const genericEmail = `device_${deviceId}@unknown.com`;
        
        employee = await (prisma as any).employee.create({
          data: {
            name: `Device ${deviceId}`,
            email: genericEmail,
            department: 'Unassigned',
            role: 'MEMBER',
            status: status || 'active',
            deviceId: deviceId,
            isActive: true,
            lastPing: currentTime,
            teamId: teamId  // Usar el teamId de la API key
          }
        });
        
        console.log(`Creado nuevo empleado para dispositivo no registrado: ${deviceId}`);
      } catch (createError) {
        console.error('Error al crear empleado automáticamente:', createError);
        return res.status(404).json({
          success: false,
          message: 'Employee not found and could not create automatically'
        });
      }
    } else {
      // Actualizar el estado del agente
      await (prisma as any).employee.update({
        where: { id: employee.id },
        data: {
          deviceId: deviceId,
          isActive: true,
          lastPing: currentTime,
          // Actualizar el status si se proporciona
          ...(status ? { status } : {})
        }
      });
    }

    // Verificar si hay actualizaciones pendientes para el agente
    // Esto dependerá de la implementación específica
    const shouldUpdate = false; // Aquí iría la lógica para determinar si debe actualizarse

    return res.status(200).json({
      success: true,
      message: 'Agent status updated successfully',
      shouldUpdate,
      timestamp: currentTime.toISOString()
    });
  } catch (error) {
    console.error('Error updating agent status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error'
    });
  }
} 