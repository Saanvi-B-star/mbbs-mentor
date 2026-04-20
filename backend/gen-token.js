const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  const token = jwt.sign(
    { userId: user.id },
    'dev_jwt_secret_change_me_2025_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    { expiresIn: '1h' }
  );
  console.log(token);
  await prisma.$disconnect();
}
run();
