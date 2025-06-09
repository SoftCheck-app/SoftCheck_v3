#!/usr/bin/env node

/**
 * Script de prueba para verificar el endpoint de ping del agente
 * con resolución automática de team por API key
 */

const crypto = require('crypto');

// Configuración
const BACKEND_URL = 'http://localhost:4002/api';
const API_KEY = '8614b11fc82969369d0980fa37f03381'; // Misma que en el agente

// Función para hashear la API key (igual que en el backend)
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function testPing() {
  console.log('===========================================');
  console.log('PRUEBA DE PING DEL AGENTE');
  console.log('===========================================');
  
  console.log('API Key:', API_KEY.substring(0, 8) + '...');
  console.log('API Key hasheada:', hashApiKey(API_KEY).substring(0, 16) + '...');
  console.log('Endpoint:', `${BACKEND_URL}/agents/ping`);
  
  const payload = {
    deviceId: 'SERIAL-TEST123',
    employeeEmail: 'test@example.com',
    status: 'active'
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${BACKEND_URL}/agents/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'SoftCheck-Test-Agent/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('\n--- RESPUESTA DEL SERVIDOR ---');
    console.log('Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('Respuesta cruda:', responseText);
    
    // Intentar parsear como JSON
    try {
      const responseJson = JSON.parse(responseText);
      console.log('Respuesta JSON:', JSON.stringify(responseJson, null, 2));
      
      if (responseJson.success) {
        console.log('\n✅ PRUEBA EXITOSA: El ping funcionó correctamente');
        console.log('- El team se resolvió automáticamente usando la API key');
        console.log('- El empleado fue creado o actualizado correctamente');
      } else {
        console.log('\n❌ PRUEBA FALLIDA:', responseJson.message);
      }
    } catch (parseError) {
      if (responseText.includes('/auth/login')) {
        console.log('\n❌ ERROR: El endpoint aún requiere autenticación web');
        console.log('- Verificar que el endpoint no esté protegido por NextAuth');
      } else {
        console.log('\n❌ ERROR: Respuesta no es JSON válido');
        console.log('Parse error:', parseError.message);
      }
    }
    
  } catch (error) {
    console.log('\n❌ ERROR DE CONEXIÓN:', error.message);
  }
  
  console.log('\n===========================================');
}

// Ejecutar la prueba
testPing().catch(console.error); 