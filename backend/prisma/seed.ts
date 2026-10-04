import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const businessUser = await prisma.user.upsert({
    where: {
      email: 'negocio@promos.test',
    },
    update: {
      password,
      role: UserRole.NEGOCIO,
      status: true,
    },
    create: {
      name: 'Usuario Negocio',
      email: 'negocio@promos.test',
      password,
      role: UserRole.NEGOCIO,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: {
      email: 'admin@promos.test',
    },
    update: {
      password,
      role: UserRole.ADMIN,
      status: true,
    },
    create: {
      name: 'Administrador',
      email: 'admin@promos.test',
      password,
      role: UserRole.ADMIN,
    },
  });

  console.log('Usuarios de desarrollo:');

  console.log({
    id: businessUser.id,
    email: businessUser.email,
    role: businessUser.role,
  });

  console.log({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });