// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Delete all records from all tables
  await prisma.preorderItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.openingHour.deleteMany();
  await prisma.table.deleteMany();
  await prisma.restaurant.deleteMany();
  // Add more models here if needed
  console.log("All records deleted from all tables.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
