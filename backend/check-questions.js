const { PrismaClient } = require('@prisma/client');
async function check() {
  const prisma = new PrismaClient();
  const total = await prisma.question.count();
  const approved = await prisma.question.count({ where: { isApproved: true } });
  const active = await prisma.question.count({ where: { isActive: true } });
  const both = await prisma.question.count({ where: { isApproved: true, isActive: true } });
  console.log(`Total questions: ${total}`);
  console.log(`isApproved=true: ${approved}`);
  console.log(`isActive=true: ${active}`);
  console.log(`both approved+active: ${both}`);
  await prisma.$disconnect();
}
check();
