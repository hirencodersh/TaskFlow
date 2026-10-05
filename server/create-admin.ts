import { prisma } from './src/lib/prisma.js';
import { hashPassword } from './src/utils/password.js';

async function main() {
  const passwordHash = await hashPassword(
    'Admin@12345',
  );

  const admin = await prisma.user.create({
    data: {
      name: 'TaskFlow Admin',
      email: 'admin@taskflow.local',
      passwordHash,
      role: 'ADMIN',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log('Admin created:', admin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });