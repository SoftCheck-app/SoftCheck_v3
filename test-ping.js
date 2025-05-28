const https = require('http');

const data = JSON.stringify({
  deviceId: 'TEST-DEVICE-123',
  employeeEmail: 'test@example.com',
  status: 'active'
});

const options = {
  hostname: 'localhost',
  port: 4002,
  path: '/api/agents/ping',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '83dc386a4a636411e068f86bbe5de3bd',
    'Content-Length': data.length
  }
};

console.log('🔄 Probando endpoint de ping...');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('API Key:', options.headers['x-api-key']);

const req = https.request(options, (res) => {
  console.log(`\n📊 Respuesta del servidor:`);
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('\n📝 Cuerpo de la respuesta:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(responseData);
    }
    
    if (res.statusCode === 200) {
      console.log('\n✅ ¡Ping exitoso! La autenticación funciona correctamente.');
    } else if (res.statusCode === 401) {
      console.log('\n❌ Error 401: Problema de autenticación.');
    } else {
      console.log(`\n⚠️  Código de estado inesperado: ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Error en la petición:', error.message);
});

req.write(data);
req.end(); 