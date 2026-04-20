import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'Admin@123';
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email,
      name: 'Platform Admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      authProvider: 'EMAIL',
      currentTokenBalance: 1000,
    },
  });

  console.log(`Admin user ${admin.email} created/updated successfully with role ${admin.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
