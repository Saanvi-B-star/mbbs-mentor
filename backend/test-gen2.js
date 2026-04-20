const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');
const fs = require('fs');

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  const token = jwt.sign(
    { userId: user.id },
    'dev_jwt_secret_change_me_2025_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    { expiresIn: '1h' }
  );

  const body = JSON.stringify({ testType: "PRACTICE", totalQuestions: 5, subjectIds: ["Anatomy"] });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/tests/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      fs.writeFileSync('test-gen-result.json', data);
      try {
        const parsed = JSON.parse(data);
        if (parsed.success) {
          console.log('SUCCESS! Test id:', parsed.data.id, 'Questions:', parsed.data.totalQuestions);
        } else {
          console.log('FAIL:', parsed.message);
          console.log('Error detail:', (parsed.error?.message || '').substring(0, 400));
        }
      } catch (e) {
        console.log('Raw response:', data.substring(0, 400));
      }
    });
  });

  req.on('error', (e) => console.error('Request error:', e.message));
  req.write(body);
  req.end();

  await new Promise(r => setTimeout(r, 3000));
  await prisma.$disconnect();
}

run();
