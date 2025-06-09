import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateApprovedDates() {
  try {
    console.log('Iniciando migración de fechas de aprobación...');
    
    // Buscar todos los software que están aprobados o denegados pero no tienen approvedDate
    const softwareToUpdate = await prisma.softwareDatabase.findMany({
      where: {
        approvedDate: null,
        OR: [
          { isApproved: true },
          { 
            AND: [
              { isApproved: false },
              { status: 'denied' }
            ]
          },
          {
            notes: {
              startsWith: 'APPROVED:'
            }
          },
          {
            notes: {
              startsWith: 'DENIED:'
            }
          }
        ]
      }
    });

    console.log(`Encontrados ${softwareToUpdate.length} registros para actualizar`);

    if (softwareToUpdate.length === 0) {
      console.log('No hay registros que necesiten actualización');
      return;
    }

    // Actualizar cada registro
    let updated = 0;
    for (const software of softwareToUpdate) {
      await prisma.softwareDatabase.update({
        where: { id: software.id },
        data: {
          approvedDate: software.installDate // Usar installDate como aproximación
        }
      });
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`Actualizados ${updated}/${softwareToUpdate.length} registros...`);
      }
    }

    console.log(`✅ Migración completada: ${updated} registros actualizados`);
    
    // Verificar resultados
    const verifyCount = await prisma.softwareDatabase.count({
      where: {
        approvedDate: {
          not: null
        },
        OR: [
          { isApproved: true },
          { 
            AND: [
              { isApproved: false },
              { status: 'denied' }
            ]
          }
        ]
      }
    });

    console.log(`✅ Verificación: ${verifyCount} registros ahora tienen approvedDate`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  migrateApprovedDates();
}

export default migrateApprovedDates; 