import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ipos = await prisma.ipo.findMany({ 
    include: { applications: true } 
  });
  
  for (const ipo of ipos) {
    for (const app of ipo.applications) {
      if (app.amountSent === 14982 && ipo.lotValue === 15000 && app.sharesAllotted === 105 && ipo.lotSize === 120) {
        console.log({
          ipoName: ipo.name,
          amountSent: app.amountSent,
          lotValue: ipo.lotValue,
          sharesAllotted: app.sharesAllotted,
          lotSize: ipo.lotSize,
          amountTransferred: app.amountTransferred,
          receivedFromApplicant: app.receivedFromApplicant,
          amountReceivedFromApplicant: app.amountReceivedFromApplicant
        });
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
