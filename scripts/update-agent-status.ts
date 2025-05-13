import { PrismaClient } from '@prisma/client';
import { subHours } from 'date-fns';

// Este script se puede ejecutar como un cron job o tarea programada
// para actualizar automáticamente el estado de los agentes inactivos

async function updateAgentStatus() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Iniciando actualización de estado de agentes...');
    
    // Considerar inactivos los agentes que no han hecho ping en las últimas 24 horas
    const inactiveThreshold = subHours(new Date(), 24);
    
    // Actualizar los agentes que no han hecho ping recientemente
    const updated = await (prisma as any).employee.updateMany({
      where: {
        deviceId: {
          not: null
        },
        isActive: true,
        OR: [
          {
            lastPing: {
              lt: inactiveThreshold
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
    
    console.log(`${updated.count} agentes marcados como inactivos por falta de actividad.`);
    
    // Registro de agentes activos e inactivos
    const activeCount = await (prisma as any).employee.count({
      where: {
        deviceId: { not: null },
        isActive: true
      }
    });
    
    const inactiveCount = await (prisma as any).employee.count({
      where: {
        deviceId: { not: null },
        isActive: false
      }
    });
    
    console.log(`Estado actual: ${activeCount} agentes activos, ${inactiveCount} agentes inactivos.`);
  } catch (error) {
    console.error('Error al actualizar estado de agentes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función si se llama directamente
if (require.main === module) {
  updateAgentStatus()
    .then(() => console.log('Actualización de estado de agentes completada.'))
    .catch(err => console.error('Error:', err));
}

export default updateAgentStatus; 