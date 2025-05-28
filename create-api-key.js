const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

async function createApiKey() {
  try {
    // La API key que está usando el agente
    const apiKey = '305f98c40f6ab0224759d1725147ca1b';
    
    // Calcular el hash SHA256
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    
    console.log('API Key:', apiKey);
    console.log('Hashed Key:', hashedKey);
    
    // Buscar si ya existe un team
    let team = await prisma.team.findFirst();
    
    if (!team) {
      // Crear un team si no existe
      team = await prisma.team.create({
        data: {
          name: 'Default Team',
          slug: 'default-team'
        }
      });
      console.log('Team creado:', team.id);
    } else {
      console.log('Team encontrado:', team.id);
    }
    
    // Verificar si la API key ya existe
    const existingApiKey = await prisma.apiKey.findUnique({
      where: {
        hashedKey: hashedKey
      }
    });
    
    if (existingApiKey) {
      console.log('API Key ya existe en la base de datos');
      
      // Actualizar lastUsedAt
      await prisma.apiKey.update({
        where: { id: existingApiKey.id },
        data: { lastUsedAt: new Date() }
      });
      
      console.log('API Key actualizada exitosamente');
    } else {
      // Crear la API key
      const newApiKey = await prisma.apiKey.create({
        data: {
          name: 'Windows Agent API Key',
          teamId: team.id,
          hashedKey: hashedKey,
          lastUsedAt: new Date()
        }
      });
      
      console.log('API Key creada exitosamente:', newApiKey.id);
    }
    
    console.log('✅ API Key configurada correctamente para el agente de Windows');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createApiKey(); 