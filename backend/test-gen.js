const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');
const fs = require('fs');

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  const token = jwt.sign(
    { userId: user.id },
    'dev_jwt_secret_change_me_2025_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    { expiresIn: '1h' }
  );

  const bodyJson = JSON.stringify({ testType: "PRACTICE", totalQuestions: 5 });
  const bodyFile = 'req-body.json';
  fs.writeFileSync(bodyFile, bodyJson);

  const curlCmd = [
    'curl', '-s', '-X', 'POST',
    'http://localhost:5000/api/v1/tests/generate',
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Content-Type: application/json',
    '-d', `@${bodyFile}`
  ];

  try {
    const result = execSync(curlCmd.join(' '), { encoding: 'utf8' });
    fs.writeFileSync('test-gen-result.json', result);
    const parsed = JSON.parse(result);
    if (parsed.success) {
      console.log('SUCCESS! Test generated:', parsed.data.id, '- Questions:', parsed.data.totalQuestions);
    } else {
      console.log('FAILED:', parsed.message, parsed.error?.message?.slice(0, 200));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  fs.unlinkSync(bodyFile);
  await prisma.$disconnect();
}

run();
