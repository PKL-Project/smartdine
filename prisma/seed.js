// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** Change this to any email you want to be the demo owner */
const OWNER_EMAIL = "owner@example.com";

async function main() {
  console.log("🌱 Starting seed...");

  // Ensure we have an owner user
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { role: "OWNER" },
    create: {
      email: OWNER_EMAIL,
      name: "Demo Owner",
      role: "OWNER",
      emailVerified: new Date(),
    },
  });

  // Idempotent seed: clear data that depends on restaurants
  await prisma.preorderItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.openingHour.deleteMany();
  await prisma.table.deleteMany();
  await prisma.restaurant.deleteMany();

  const r = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: "Bistro Aurora",
      slug: "bistro-aurora",
      description: "Świeże dania kuchni europejskiej.",
      imageUrl: "https://picsum.photos/seed/aurora/1200/600",
      address: "ul. Przykładowa 10, Warszawa",
      phone: "+48 123 456 789",
      timeSlotIntervalMinutes: 30,
      tables: {
        create: [
          { name: "T1", capacity: 2 },
          { name: "T2", capacity: 4 },
          { name: "T3", capacity: 4 },
          { name: "T4", capacity: 6 },
        ],
      },
      hours: {
        create: [
          // Mon–Sun 12:00–22:00
          ...Array.from({ length: 7 }, (_, i) => ({
            weekday: i,
            openMinutes: 12 * 60,
            closeMinutes: 22 * 60,
          })),
        ],
      },
      categories: {
        create: [
          {
            name: "Przystawki",
            sort: 1,
            items: {
              create: [
                {
                  name: "Bruschetta",
                  priceCents: 1900,
                  description: "Pomidor, bazylia, oliwa.",
                },
                { name: "Zupa dnia", priceCents: 2200 },
              ],
            },
          },
          {
            name: "Dania główne",
            sort: 2,
            items: {
              create: [
                {
                  name: "Pierś z kurczaka",
                  priceCents: 4200,
                  description: "Puree ziemniaczane.",
                },
                { name: "Risotto grzybowe", priceCents: 3900 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Seeded owner:", owner.email);
  console.log("Seeded restaurant:", r.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
