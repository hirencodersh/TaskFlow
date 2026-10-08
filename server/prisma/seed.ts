import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail =
    process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@taskflow.local';

  const adminPassword =
    process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin@12345';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'TaskFlow Admin',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: 'TaskFlow Admin',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`Default admin ensured: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });