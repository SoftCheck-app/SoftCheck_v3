const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

// Función para convertir la API key en un hash
function hashApiKey(apiKey) {
  return createHash('sha256').update(apiKey).digest('hex');
}

async function registerAgentApiKey() {
  try {
    console.log('🔑 Registrando API key del agente...');
    
    // API key del agente
    const agentApiKey = '83dc386a4a636411e068f86bbe5de3bd';
    const hashedKey = hashApiKey(agentApiKey);
    
    console.log('API Key:', agentApiKey);
    console.log('Hashed Key:', hashedKey);
    
    // Buscar si ya existe un equipo
    let team = await prisma.team.findFirst();
    
    if (!team) {
      console.log('📝 No se encontró ningún equipo, creando uno nuevo...');
      
      // Crear un equipo por defecto
      team = await prisma.team.create({
        data: {
          name: 'Default Team',
          slug: 'default-team',
          domain: null,
          defaultRole: 'MEMBER'
        }
      });
      
      console.log('✅ Equipo creado:', team.name);
    } else {
      console.log('✅ Usando equipo existente:', team.name);
    }
    
    // Verificar si la API key ya existe
    const existingApiKey = await prisma.apiKey.findUnique({
      where: {
        hashedKey: hashedKey
      }
    });
    
    if (existingApiKey) {
      console.log('⚠️  La API key ya está registrada');
      return;
    }
    
    // Crear la API key
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        name: 'Agent API Key',
        teamId: team.id,
        hashedKey: hashedKey
      }
    });
    
    console.log('✅ API key registrada exitosamente');
    console.log('ID:', apiKeyRecord.id);
    console.log('Nombre:', apiKeyRecord.name);
    console.log('Equipo:', team.name);
    
  } catch (error) {
    console.error('❌ Error al registrar la API key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
registerAgentApiKey(); 