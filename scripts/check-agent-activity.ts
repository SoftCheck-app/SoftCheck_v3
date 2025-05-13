import { PrismaClient } from '@prisma/client';
import { subMinutes } from 'date-fns';

/**
 * Script para verificar y actualizar automáticamente el estado de actividad de los agentes
 * basado en el tiempo transcurrido desde su último ping.
 * 
 * Puede ejecutarse manualmente o como tarea programada (cron job).
 * 
 * Uso: npx ts-node scripts/check-agent-activity.ts
 */
async function checkAgentActivity() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Iniciando verificación de actividad de agentes...');
    
    // Considerar inactivos los agentes sin ping en el último minuto
    const oneMinuteAgo = subMinutes(new Date(), 1);
    
    // Obtener todos los agentes
    const allAgents = await (prisma as any).employee.findMany({
      where: {
        deviceId: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        deviceId: true,
        lastPing: true,
        isActive: true
      }
    });
    
    console.log(`Total de agentes: ${allAgents.length}`);
    
    // Agentes activos que no han pingeado en el último minuto
    const agentsToDeactivate = allAgents.filter(agent => 
      agent.isActive && 
      (!agent.lastPing || new Date(agent.lastPing) < oneMinuteAgo)
    );
    
    if (agentsToDeactivate.length > 0) {
      console.log(`Desactivando ${agentsToDeactivate.length} agentes sin actividad reciente:`);
      
      for (const agent of agentsToDeactivate) {
        console.log(`- ${agent.name || agent.deviceId}: Último ping ${agent.lastPing ? new Date(agent.lastPing).toISOString() : 'nunca'}`);
        
        await (prisma as any).employee.update({
          where: { id: agent.id },
          data: { isActive: false }
        });
      }
    } else {
      console.log('No se encontraron agentes para desactivar.');
    }
    
    // Estadísticas actualizadas
    const activeAgentsCount = await (prisma as any).employee.count({
      where: {
        deviceId: {
          not: null
        },
        isActive: true
      }
    });
    
    const inactiveAgentsCount = await (prisma as any).employee.count({
      where: {
        deviceId: {
          not: null
        },
        isActive: false
      }
    });
    
    console.log(`Estado actual: ${activeAgentsCount} activos, ${inactiveAgentsCount} inactivos.`);
    console.log('Verificación de actividad completada.');
    
  } catch (error) {
    console.error('Error al verificar actividad de agentes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función si se llama directamente
if (require.main === module) {
  checkAgentActivity()
    .then(() => console.log('Script de verificación de actividad finalizado.'))
    .catch(err => console.error('Error en script:', err));
}

export default checkAgentActivity; 