// Script para probar la API de validación de software
// Ejecutar con: node test-api.js

const fetch = require('node-fetch');

// URLs de los endpoints
const API_BASE_URL = 'http://localhost:4002/api';
const API_VALIDATION_URL = `${API_BASE_URL}/validate_software`;

// API key para pruebas (debe coincidir con una clave válida en la base de datos)
const API_KEY = '54b554b9f10a7b4d72123d5393ca6721';

// Datos de ejemplo para enviar a la API
const testData = {
  device_id: 'TEST-DEVICE-ID-001',
  user_id: 'cl', // ID generado con el formato que espera Prisma
  software_name: 'Test Software',
  version: '1.0.0',
  vendor: 'Test Vendor',
  install_date: new Date().toISOString(),
  install_path: '/Applications/TestSoftware.app',
  install_method: 'manual',
  last_executed: new Date().toISOString(),
  is_running: true,
  digital_signature: 'true',
  is_approved: false,
  detected_by: 'test_script',
  sha256: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z',
  notes: 'Este es un software de prueba para verificar la API'
};

async function testApiValidation() {
  console.log('Probando API de validación de software...');
  console.log('URL:', API_VALIDATION_URL);
  console.log('API Key:', `${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 5)}`);
  console.log('Datos de prueba:', JSON.stringify(testData, null, 2));
  
  try {
    // Enviar petición POST con los datos de prueba
    const response = await fetch(API_VALIDATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(testData)
    });
    
    // Obtener respuesta
    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.log('Respuesta no es JSON válido:', responseText);
      result = { error: 'Respuesta inválida', raw: responseText };
    }
    
    console.log('\nRespuesta:');
    console.log('Status:', response.status, response.statusText);
    console.log('Datos:', JSON.stringify(result, null, 2));
    
    // Verificar resultado
    if (response.ok) {
      console.log('\n✅ Prueba exitosa: API respondió correctamente');
    } else {
      console.log('\n❌ Prueba fallida: API respondió con error');
      
      // Si el error es de clave foránea, explicar claramente
      if (responseText.includes('Foreign key constraint violated')) {
        console.log('\n⚠️ El error se debe a que se requiere un userId válido en la base de datos.');
        console.log('Posibles soluciones:');
        console.log('1. Crear un empleado en la base de datos y usar su ID');
        console.log('2. Modificar el esquema Prisma para hacer que el campo userId sea opcional');
        console.log('3. Modificar el middleware o el controlador de API para manejar este caso especial');
      }
    }
  } catch (error) {
    console.error('\n❌ Error al realizar la petición:', error.message);
  }
}

// Ejecutar la prueba
testApiValidation(); 