const { PrismaClient } = require('@prisma/client');
async function run() {
  const prisma = new PrismaClient();
  const subjects = await prisma.subject.findMany({ select: { id: true, name: true, code: true } });
  console.log('Subjects:', subjects);
  await prisma.$disconnect();
}
run();
