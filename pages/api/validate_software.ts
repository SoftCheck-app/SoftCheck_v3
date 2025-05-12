import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';

// Inicializar cliente de Prisma desde lib/prisma.ts
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
 * @description API endpoint para validar e insertar software detectado por agentes
 * 
 * POST: Verificar e insertar un nuevo software detectado
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar método HTTP
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

    // Buscar la API key en la base de datos
    const validApiKey = await prisma.apiKey.findFirst({
      where: {
        hashedKey: hashedApiKey,
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

    // Validar datos recibidos
    const {
      device_id,
      user_id,
      software_name,
      version,
      vendor,
      install_date,
      install_path,
      install_method,
      last_executed,
      is_running,
      digital_signature,
      is_approved,
      detected_by,
      sha256,
      notes
    } = req.body;

    // Verificar campos obligatorios
    if (!device_id || !software_name || !version) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields',
        requiredFields: ['device_id', 'software_name', 'version']
      });
    }

    // Buscar el usuario en la base de datos
    let userId = user_id;
    
    // Si se proporciona un nombre de usuario en lugar de un ID, buscar el ID del usuario
    if (user_id && !user_id.startsWith('cl')) { // Los IDs generados normalmente comienzan con 'cl'
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { name: user_id },
            { email: user_id }
          ]
        },
        select: { id: true }
      });

      if (employee) {
        userId = employee.id;
      } else {
        // Si no se encuentra al usuario, crear una respuesta de error pero seguir procesando
        console.warn(`Usuario no encontrado: ${user_id}. Se usará el valor original.`);
      }
    } else if (!user_id) {
      // Si no se proporciona un user_id, establecerlo como null
      userId = null;
    }

    // Verificar si el software ya existe
    let whereClause: any = {
      deviceId: device_id,
      softwareName: software_name,
      version: version
    };
    
    // Solo añadir userId a la consulta si no es null
    if (userId !== null) {
      whereClause.userId = userId;
    }
    
    const existingSoftware = await prisma.softwareDatabase.findFirst({
      where: whereClause
    });

    if (existingSoftware) {
      // Actualizar software existente
      await prisma.softwareDatabase.update({
        where: { id: existingSoftware.id },
        data: {
          isRunning: is_running || false,
          lastExecuted: last_executed ? new Date(last_executed) : new Date(),
          // No actualizamos otros campos como install_path, etc. para preservar la información original
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Software updated successfully',
        isApproved: existingSoftware.isApproved,
        softwareId: existingSoftware.id
      });
    }

    // Insertar nuevo software
    try {
      // Primero comprobar si el userId existe en la base de datos
      if (userId) {
        const employee = await prisma.employee.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        
        if (!employee) {
          // Si el usuario no existe, intentamos crearlo automáticamente
          console.log(`Usuario ${userId} no encontrado. Creando automáticamente...`);
          
          try {
            // Crear empleado automáticamente con datos básicos
            const newEmployee = await prisma.employee.create({
              data: {
                ...(userId.startsWith('cl') ? { id: userId } : {}), // Usar el ID proporcionado solo si tiene el formato correcto
                name: `Usuario ${userId}`, // Nombre genérico
                email: `${userId.toLowerCase().replace(/[^a-z0-9]/gi, '')}@example.com`, // Email válido basado en el ID
                department: 'Automatic',
                role: 'User',
                status: 'active'
              }
            });
            
            // Actualizar userId con el ID del nuevo empleado (podría ser diferente si Prisma generó uno)
            userId = newEmployee.id;
            console.log(`Usuario creado automáticamente con ID: ${userId}`);
            // Continuar con la creación del software usando el ID del nuevo empleado
          } catch (employeeError) {
            console.error('Error al crear empleado automáticamente:', employeeError);
            return res.status(400).json({
              success: false,
              message: 'No se pudo crear el usuario automáticamente',
              error: String(employeeError)
            });
          }
        }
      } else {
        // Si no se proporciona userId, devolvemos un error claro
        return res.status(400).json({
          success: false,
          message: 'Se requiere un ID de usuario válido para registrar software',
          error: 'Missing userId: A valid userId is required to register software'
        });
      }
      
      const newSoftware = await prisma.softwareDatabase.create({
        data: {
          deviceId: device_id,
          userId: userId, // El userId debería existir ahora, ya sea que existía antes o lo creamos automáticamente
          softwareName: software_name,
          version: version,
          vendor: vendor || 'Unknown',
          installDate: install_date ? new Date(install_date) : new Date(),
          installPath: install_path || '',
          installMethod: install_method || 'manual',
          lastExecuted: last_executed ? new Date(last_executed) : new Date(),
          isRunning: is_running || false,
          digitalSignature: digital_signature === 'true' ? 'Valid' : 'Invalid',
          isApproved: is_approved || false, // Por defecto, el software no está aprobado
          detectedBy: detected_by || 'agent',
          sha256: sha256 || '',
          notes: notes || null,
        }
      });

      // Respuesta exitosa
      return res.status(200).json({
        success: true,
        message: 'Software registered successfully',
        isApproved: newSoftware.isApproved,
        softwareId: newSoftware.id
      });
    } catch (dbError) {
      console.error('Error creating software entry:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating software entry',
        error: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
      });
    }

  } catch (error) {
    console.error('Error processing software validation:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
} 