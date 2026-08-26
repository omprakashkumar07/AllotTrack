import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting capital data migration...');
  
  // Find a user with totalFunds set
  const user = await prisma.user.findFirst({
    where: {
      totalFunds: {
        not: null
      }
    }
  });

  if (!user || user.totalFunds === null) {
    console.log('No user with totalFunds found. Nothing to migrate.');
    return;
  }

  const existingCapital = await prisma.capitalTransaction.findFirst();
  if (existingCapital) {
    console.log('Capital transactions already exist. Migration may have been run already. Skipping.');
    return;
  }

  console.log(`Migrating totalFunds: ${user.totalFunds} to CapitalTransaction ledger...`);

  await prisma.capitalTransaction.create({
    data: {
      type: 'add',
      amount: user.totalFunds,
      reason: 'Initial capital'
    }
  });

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
