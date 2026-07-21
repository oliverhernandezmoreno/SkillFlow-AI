import { seedDemoAccess } from '../src/application/system/services/demo-access-seed.service.js';
import { prismaClient } from '../src/infrastructure/prisma/prisma-client.js';

async function main(): Promise<void> {
  const summary = await seedDemoAccess(prismaClient);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
