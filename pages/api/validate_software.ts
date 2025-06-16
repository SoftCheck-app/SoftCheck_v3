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

    // Buscar la API key en la base de datos e incluir información del team
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

    // Actualizar fecha de último uso
    await prisma.apiKey.update({
      where: { id: validApiKey.id },
      data: { lastUsedAt: new Date() }
    });

    // Obtener el teamId de la API key
    const teamId = validApiKey.teamId;

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
    let employeeNotFound = false;
    
    // Si se proporciona un nombre de usuario en lugar de un ID, buscar el ID del usuario
    if (user_id && !user_id.startsWith('cl')) { // Los IDs generados normalmente comienzan con 'cl'
      const employee = await (prisma as any).employee.findFirst({
        where: {
          teamId: teamId,
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
        // Si no se encuentra al usuario, marcar para crear uno genérico después
        console.warn(`Usuario no encontrado: ${user_id}. Se usará un empleado genérico.`);
        employeeNotFound = true;
      }
    } else if (!user_id) {
      // Si no se proporciona un user_id, marcar para crear uno genérico después
      console.warn(`No se proporcionó usuario. Se usará un empleado genérico.`);
      employeeNotFound = true;
    }

    // Buscar o crear un empleado genérico para casos donde no se encuentra el usuario
    if (employeeNotFound) {
      const genericEmployee = await (prisma as any).employee.findFirst({
        where: { 
          email: 'generic_system_user@softcheck.com',
          teamId: teamId
        },
        select: { id: true }
      });
      
      if (genericEmployee) {
        // Usar el empleado genérico existente
        userId = genericEmployee.id;
        console.log(`Usando empleado genérico existente con ID: ${userId}`);
      } else {
        // Crear un empleado genérico si no existe
        try {
          const newGenericEmployee = await (prisma as any).employee.create({
            data: {
              teamId: teamId,
              name: 'Sistema Genérico',
              email: 'generic_system_user@softcheck.com',
              department: 'System',
              role: 'System',
              status: 'active'
            }
          });
          userId = newGenericEmployee.id;
          console.log(`Empleado genérico creado con ID: ${userId}`);
        } catch (genericError) {
          // Si hay error al crear el empleado genérico (posible race condition), buscar de nuevo
          console.error('Error al crear empleado genérico, intentando buscar uno existente:', genericError);
          const retryGenericEmployee = await (prisma as any).employee.findFirst({
            where: { 
              email: 'generic_system_user@softcheck.com',
              teamId: teamId
            },
            select: { id: true }
          });
          
          if (retryGenericEmployee) {
            userId = retryGenericEmployee.id;
            console.log(`Recuperado empleado genérico existente con ID: ${userId}`);
          } else {
            return res.status(500).json({
              success: false,
              message: 'Error al crear o encontrar un empleado genérico',
              error: String(genericError)
            });
          }
        }
      }
    }

    // Verificar si el software ya existe
    let whereClause: any = {
      teamId: teamId,
      deviceId: device_id,
      softwareName: software_name,
      version: version
    };
    
    // Solo añadir userId a la consulta si no es null
    if (userId !== null) {
      whereClause.userId = userId;
    }
    
    const existingSoftware = await (prisma as any).softwareDatabase.findFirst({
      where: whereClause
    });

    // Calcular RiskLevel basado en temperatura_evaluacion
    let riskLevel = 0;
    if (req.body.temperatura_evaluacion !== undefined) {
      // Convertir temperatura_evaluacion a un número entre 0 y 100
      riskLevel = Math.round(req.body.temperatura_evaluacion * 100);
      // Asegurar que esté entre 0 y 100
      riskLevel = Math.max(0, Math.min(100, riskLevel));
    }

    if (existingSoftware) {
      // Actualizar software existente
      await (prisma as any).softwareDatabase.update({
        where: { id: existingSoftware.id },
        data: {
          isRunning: is_running || false,
          lastExecuted: last_executed ? new Date(last_executed) : new Date(),
          RiskLevel: riskLevel,
          // No actualizamos otros campos como install_path, etc. para preservar la información original
        }
      });

      // Preparar información de autorización si está disponible
      let authorizationInfo: any = {
        success: true,
        message: 'Software updated successfully',
        isApproved: existingSoftware.isApproved,
        softwareId: existingSoftware.id
      };

      // Si el software ha sido procesado para autorización, incluir información adicional
      if (existingSoftware.notes) {
        if (existingSoftware.notes.startsWith('APPROVED:')) {
          authorizationInfo.autorizado = 1;
          authorizationInfo.razon = existingSoftware.notes.replace('APPROVED: ', '');
        } else if (existingSoftware.notes.startsWith('DENIED:')) {
          authorizationInfo.autorizado = 0;
          authorizationInfo.razon = existingSoftware.notes.replace('DENIED: ', '');
          authorizationInfo.isRejected = true;
        }
      }

      return res.status(200).json(authorizationInfo);
    }

    // Insertar nuevo software
    try {
      // Primero comprobar si el userId existe en la base de datos
      if (userId) {
        const employee = await (prisma as any).employee.findFirst({
          where: { 
            id: userId,
            teamId: teamId
          },
          select: { id: true }
        });
        
        if (!employee) {
          // Si el usuario no existe, intentamos crearlo automáticamente
          console.log(`Usuario ${userId} no encontrado. Creando automáticamente...`);
          
          try {
            // Crear empleado automáticamente con datos básicos
            const newEmployee = await (prisma as any).employee.create({
              data: {
                ...(userId.startsWith('cl') ? { id: userId } : {}), // Usar el ID proporcionado solo si tiene el formato correcto
                teamId: teamId,
                name: `Usuario ${userId}`, // Nombre genérico
                email: `${userId.toLowerCase().replace(/[^a-z0-9]/gi, '')}_${Date.now()}@example.com`, // Email con timestamp para evitar duplicados
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
        // (Este código ahora es inalcanzable porque siempre tendremos un userId
        // ya sea el original, uno creado automáticamente, o el genérico)
        /*
        return res.status(400).json({
          success: false,
          message: 'Se requiere un ID de usuario válido para registrar software',
          error: 'Missing userId: A valid userId is required to register software'
        });
        */
      }
      
      const newSoftware = await (prisma as any).softwareDatabase.create({
        data: {
          teamId: teamId,
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
          RiskLevel: riskLevel,
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