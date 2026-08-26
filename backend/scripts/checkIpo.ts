import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ipos = await prisma.ipo.findMany({ where: { name: { contains: 'Symbiotec' } } });
  console.log(ipos.map(i => ({ name: i.name, listingDate: i.listingDate })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
