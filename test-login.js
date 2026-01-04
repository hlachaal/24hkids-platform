// Script pour tester l'API de login
const http = require('http');

const data = JSON.stringify({
  email: 'alice.martin@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();