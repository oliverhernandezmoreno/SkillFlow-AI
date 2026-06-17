import { prismaClient } from '../src/infrastructure/prisma/prisma-client.js';
import { bootstrapDemoData } from '../src/application/system/services/demo-bootstrap.service.js';

async function main(): Promise<void> {
  const summary = await bootstrapDemoData({}, prismaClient);
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
