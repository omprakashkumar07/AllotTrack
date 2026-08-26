import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up invalid received transactions...');
  
  const unreceivedApps = await prisma.application.findMany({
    where: { receivedFromApplicant: false },
    select: { id: true }
  });

  const appIds = unreceivedApps.map((a: any) => a.id);

  if (appIds.length > 0) {
    const result = await prisma.fundTransaction.deleteMany({
      where: {
        type: 'received',
        applicationId: { in: appIds }
      }
    });
    console.log(`Deleted ${result.count} invalid received transactions.`);
  } else {
    console.log('No invalid transactions found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
