const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  const token = jwt.sign(
    { userId: user.id },
    'dev_jwt_secret_change_me_2025_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    { expiresIn: '1h' }
  );

  // Write a temp test file
  const tmpFile = path.join(__dirname, 'test-note.txt');
  fs.writeFileSync(tmpFile, 'This is a test medical note about pathology.');

  // Use curl (requires curl on system path)
  const curlCmd = `curl -s -X POST http://localhost:5000/api/v1/notes/upload -H "Authorization: Bearer ${token}" -F "file=@${tmpFile};type=application/pdf" -F "title=Test Note" -F "tags=test,pathology"`;

  try {
    const result = execSync(curlCmd, { encoding: 'utf8' });
    fs.writeFileSync('curl-result.json', result);
    console.log('Result saved to curl-result.json');
    console.log(result.substring(0, 500));
  } catch (e) {
    console.error('curl failed:', e.message);
  }

  fs.unlinkSync(tmpFile);
  await prisma.$disconnect();
}

run();
