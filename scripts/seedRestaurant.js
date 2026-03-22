// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const restaurantName = process.argv[2];
  const ownerEmail = process.argv[3];

  if (!restaurantName || !ownerEmail) {
    console.error("❌ Usage: npm run seed:restaurant <restaurant-name> <owner-email>");
    process.exit(1);
  }

  console.log(`🌱 Seeding restaurant "${restaurantName}" for owner ${ownerEmail}...`);

  // Create or update owner user
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: "OWNER" },
    create: {
      email: ownerEmail,
      name: "Restaurant Owner",
      role: "OWNER",
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Owner created/updated: ${owner.email}`);

  // Create slug from restaurant name
  const slug = restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Create restaurant with full setup
  const restaurant = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: restaurantName,
      slug: slug,
      description: "Restauracja z pysznym jedzeniem i przyjemną atmosferą.",
      imageUrl: `https://picsum.photos/seed/${slug}/1200/600`,
      address: "ul. Przykładowa 10, Warszawa",
      phone: "+48 123 456 789",
      slotDurationMinutes: 90,

      // Create tables
      tables: {
        create: [
          { name: "Stolik 2p #1", capacity: 2 },
          { name: "Stolik 2p #2", capacity: 2 },
          { name: "Stolik 2p #3", capacity: 2 },
          { name: "Stolik 4p #1", capacity: 4 },
          { name: "Stolik 4p #2", capacity: 4 },
          { name: "Stolik 6p #1", capacity: 6 },
        ],
      },

      // Create opening hours (Mon-Sun 10:00-22:00)
      hours: {
        create: Array.from({ length: 7 }, (_, i) => ({
          weekday: i,
          openMinutes: 10 * 60,  // 10:00
          closeMinutes: 22 * 60,  // 22:00
        })),
      },

      // Create time slots (8 slots of 90 minutes each, starting at 10:00)
      timeSlots: {
        create: Array.from({ length: 8 }, (_, i) => ({
          startMinutes: 10 * 60 + i * 90,  // 10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00, 20:30
          durationMinutes: 90,
        })),
      },

      // Create menu categories and items
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
                  description: "Pomidory, bazylia, oliwa z oliwek",
                  isAvailable: true,
                },
                {
                  name: "Zupa dnia",
                  priceCents: 2200,
                  description: "Zapytaj kelnera o zupę dnia",
                  isAvailable: true,
                },
                {
                  name: "Carpaccio wołowe",
                  priceCents: 3200,
                  description: "Cienkie plastry wołowiny z rukolą i parmezanem",
                  isAvailable: true,
                },
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
                  description: "Z puree ziemniaczanym i warzywami",
                  isAvailable: true,
                },
                {
                  name: "Risotto grzybowe",
                  priceCents: 3900,
                  description: "Kremowe risotto z borowikami",
                  isAvailable: true,
                },
                {
                  name: "Stek wołowy",
                  priceCents: 5900,
                  description: "200g polędwicy z frytkami i sałatą",
                  isAvailable: true,
                },
                {
                  name: "Łosoś grillowany",
                  priceCents: 4900,
                  description: "Z ryżem i sosem cytrynowym",
                  isAvailable: true,
                },
              ],
            },
          },
          {
            name: "Desery",
            sort: 3,
            items: {
              create: [
                {
                  name: "Tiramisu",
                  priceCents: 2200,
                  description: "Klasyczny włoski deser",
                  isAvailable: true,
                },
                {
                  name: "Lody",
                  priceCents: 1500,
                  description: "3 gałki do wyboru",
                  isAvailable: true,
                },
                {
                  name: "Sernik nowojorski",
                  priceCents: 2400,
                  description: "Z sosem malinowym",
                  isAvailable: true,
                },
              ],
            },
          },
          {
            name: "Napoje",
            sort: 4,
            items: {
              create: [
                {
                  name: "Kawa",
                  priceCents: 900,
                  description: "Espresso, cappuccino, latte",
                  isAvailable: true,
                },
                {
                  name: "Herbata",
                  priceCents: 800,
                  description: "Czarna, zielona, owocowa",
                  isAvailable: true,
                },
                {
                  name: "Sok świeżo wyciskany",
                  priceCents: 1200,
                  description: "Pomarańczowy lub jabłkowy",
                  isAvailable: true,
                },
                {
                  name: "Woda mineralna",
                  priceCents: 600,
                  description: "Gazowana lub niegazowana 0.5L",
                  isAvailable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✅ Restaurant created: ${restaurant.name}`);
  console.log(`   Slug: ${restaurant.slug}`);
  console.log(`   URL: /restaurants/${restaurant.slug}`);
  console.log(`   Owner panel: /owner/${restaurant.slug}/reservations`);
  console.log(`\n🎉 Done! Restaurant is ready for reservations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
