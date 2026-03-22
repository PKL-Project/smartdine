// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const restaurants = [
  {
    name: "Bella Italia",
    ownerEmail: "owner1@example.com",
    description: "Autentyczna kuchnia włoska w sercu miasta. Świeże makarony i pizza z pieca opalanego drewnem.",
    address: "ul. Marszałkowska 12, Warszawa",
    phone: "+48 22 123 4567",
    slotDurationMinutes: 90,
    openDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    openTime: 12 * 60, // 12:00
    closeTime: 22 * 60, // 22:00
    categories: [
      {
        name: "Antipasti",
        sort: 1,
        items: [
          { name: "Bruschetta al Pomodoro", priceCents: 1800, description: "Grillowane pieczywo z pomidorami, bazylią i czosnkiem" },
          { name: "Carpaccio di Manzo", priceCents: 3200, description: "Cienkie plastry surowej wołowiny z rukolą i parmezanem" },
          { name: "Caprese", priceCents: 2400, description: "Mozzarella di bufala, pomidory, bazylia, oliwa" },
        ],
      },
      {
        name: "Pasta",
        sort: 2,
        items: [
          { name: "Spaghetti Carbonara", priceCents: 3600, description: "Boczek, jajko, pecorino, czarny pieprz" },
          { name: "Tagliatelle al Tartufo", priceCents: 4900, description: "Domowe tagliatelle z czarną truflą" },
          { name: "Lasagne alla Bolognese", priceCents: 3900, description: "Klasyczna lasagne z sosem mięsnym" },
          { name: "Penne Arrabbiata", priceCents: 2900, description: "Pikantny sos pomidorowy z czosnkiem" },
        ],
      },
      {
        name: "Pizza",
        sort: 3,
        items: [
          { name: "Margherita", priceCents: 2800, description: "Sos pomidorowy, mozzarella, bazylia" },
          { name: "Quattro Formaggi", priceCents: 3600, description: "Cztery rodzaje sera" },
          { name: "Prosciutto e Funghi", priceCents: 3800, description: "Szynka, pieczarki, mozzarella" },
          { name: "Diavola", priceCents: 3500, description: "Pikantne salami, papryczki chili" },
        ],
      },
      {
        name: "Dolci",
        sort: 4,
        items: [
          { name: "Tiramisu", priceCents: 2200, description: "Klasyczny włoski deser z mascarpone" },
          { name: "Panna Cotta", priceCents: 1900, description: "Z sosem malinowym" },
          { name: "Gelato", priceCents: 1600, description: "3 gałki włoskich lodów" },
        ],
      },
    ],
  },
  {
    name: "Sushi Master",
    ownerEmail: "owner2@example.com",
    description: "Najlepsze sushi w mieście. Świeże ryby dostarczone codziennie, tradycyjne japońskie smaki.",
    address: "ul. Nowy Świat 28, Warszawa",
    phone: "+48 22 234 5678",
    slotDurationMinutes: 60,
    openDays: [0, 1, 2, 3, 4, 5, 6], // Every day
    openTime: 12 * 60, // 12:00
    closeTime: 21 * 60, // 21:00
    categories: [
      {
        name: "Maki",
        sort: 1,
        items: [
          { name: "California Roll", priceCents: 2800, description: "8 szt. - krab, awokado, ogórek, tobiko" },
          { name: "Spicy Tuna Roll", priceCents: 3200, description: "8 szt. - tuńczyk, pikantny sos, ogórek" },
          { name: "Philadelphia Roll", priceCents: 3400, description: "8 szt. - łosoś, ser philadelphia, ogórek" },
          { name: "Sake Maki", priceCents: 2400, description: "6 szt. - łosoś" },
        ],
      },
      {
        name: "Nigiri",
        sort: 2,
        items: [
          { name: "Sake Nigiri", priceCents: 1800, description: "2 szt. - łosoś" },
          { name: "Maguro Nigiri", priceCents: 2200, description: "2 szt. - tuńczyk" },
          { name: "Ebi Nigiri", priceCents: 1600, description: "2 szt. - krewetka" },
          { name: "Unagi Nigiri", priceCents: 2400, description: "2 szt. - węgorz" },
        ],
      },
      {
        name: "Sashimi",
        sort: 3,
        items: [
          { name: "Mix Sashimi", priceCents: 4900, description: "12 szt. - łosoś, tuńczyk, maślanka" },
          { name: "Sake Sashimi", priceCents: 3900, description: "8 szt. - łosoś" },
          { name: "Maguro Sashimi", priceCents: 4500, description: "8 szt. - tuńczyk" },
        ],
      },
      {
        name: "Dodatki",
        sort: 4,
        items: [
          { name: "Miso Soup", priceCents: 900, description: "Tradycyjna zupa miso" },
          { name: "Edamame", priceCents: 1200, description: "Gotowane na parze zielone soje" },
          { name: "Wakame Salad", priceCents: 1600, description: "Sałatka z wodorostów" },
        ],
      },
    ],
  },
  {
    name: "Burgerholic",
    ownerEmail: "owner3@example.com",
    description: "Najlepsze burgery w mieście! Świeże mięso, domowe bułki i autorskie sosy.",
    address: "ul. Bracka 15, Warszawa",
    phone: "+48 22 345 6789",
    slotDurationMinutes: 60,
    openDays: [1, 2, 3, 4, 5, 6, 0], // Every day
    openTime: 11 * 60, // 11:00
    closeTime: 22 * 60, // 22:00
    categories: [
      {
        name: "Burgery Classic",
        sort: 1,
        items: [
          { name: "Classic Burger", priceCents: 2900, description: "Wołowina 200g, ser cheddar, pomidor, sałata, cebula" },
          { name: "Cheeseburger Deluxe", priceCents: 3200, description: "Podwójne mięso, podwójny ser, bekon" },
          { name: "BBQ Burger", priceCents: 3400, description: "Wołowina, krążki cebulowe, sos BBQ, bekon" },
          { name: "Mushroom Swiss", priceCents: 3300, description: "Pieczarki, ser szwajcarski, karmelizowana cebula" },
        ],
      },
      {
        name: "Burgery Premium",
        sort: 2,
        items: [
          { name: "Truffle Burger", priceCents: 4500, description: "Wołowina, trufla, gorgonzola, rukola" },
          { name: "Wagyu Burger", priceCents: 5900, description: "Mięso wagyu, foie gras, karmelizowana cebula" },
          { name: "Surf & Turf", priceCents: 4900, description: "Wołowina, krewetki, awokado, aioli" },
        ],
      },
      {
        name: "Dodatki",
        sort: 3,
        items: [
          { name: "Frytki Regular", priceCents: 1200, description: "Chrupiące frytki ze skórką" },
          { name: "Frytki Sweet Potato", priceCents: 1500, description: "Frytki z batata" },
          { name: "Onion Rings", priceCents: 1400, description: "Krążki cebulowe w panierce" },
          { name: "Coleslaw", priceCents: 900, description: "Surówka z białej kapusty" },
        ],
      },
      {
        name: "Napoje",
        sort: 4,
        items: [
          { name: "Coca Cola", priceCents: 800, description: "0.33L" },
          { name: "Lemonade", priceCents: 1200, description: "Domowa lemoniada" },
          { name: "Milkshake", priceCents: 1600, description: "Waniliowy, czekoladowy lub truskawkowy" },
        ],
      },
    ],
  },
  {
    name: "Green Garden",
    ownerEmail: "owner4@example.com",
    description: "Wegańska restauracja z bogatym menu. Zdrowo, smacznie i ekologicznie.",
    address: "ul. Mokotowska 45, Warszawa",
    phone: "+48 22 456 7890",
    slotDurationMinutes: 90,
    openDays: [1, 2, 3, 4, 5], // Mon-Fri only
    openTime: 8 * 60, // 8:00 (breakfast)
    closeTime: 19 * 60, // 19:00
    categories: [
      {
        name: "Śniadania",
        sort: 1,
        items: [
          { name: "Smoothie Bowl", priceCents: 2400, description: "Acai, banany, granola, świeże owoce" },
          { name: "Avocado Toast", priceCents: 2200, description: "Awokado, pomidory cherry, kiełki, chleb razowy" },
          { name: "Wegańska Jajecznica", priceCents: 2600, description: "Z tofu, warzywami i pieczywo" },
        ],
      },
      {
        name: "Bowls",
        sort: 2,
        items: [
          { name: "Buddha Bowl", priceCents: 3200, description: "Quinoa, ciecierzyca, warzywa pieczone, hummus" },
          { name: "Poke Bowl", priceCents: 3600, description: "Ryż, marynowane tofu, edamame, awokado, algi" },
          { name: "Mexican Bowl", priceCents: 3400, description: "Czarna fasola, kukurydza, guacamole, salsa" },
        ],
      },
      {
        name: "Dania główne",
        sort: 3,
        items: [
          { name: "Burger Wegański", priceCents: 2900, description: "Kotlet z ciecierzycy, warzywa, sos tahini" },
          { name: "Curry z Ciecierzycą", priceCents: 3100, description: "Kremowe curry, mleko kokosowe, ryż" },
          { name: "Lasagne Warzywna", priceCents: 3300, description: "Szpinak, bakłażan, sos pomidorowy, ser wegański" },
        ],
      },
      {
        name: "Napoje",
        sort: 4,
        items: [
          { name: "Świeży Sok", priceCents: 1400, description: "Marchew-pomarańcza-imbir" },
          { name: "Kombucha", priceCents: 1200, description: "Fermentowana herbata" },
          { name: "Matcha Latte", priceCents: 1600, description: "Z mlekiem sojowym" },
          { name: "Kawa", priceCents: 900, description: "Z mlekiem roślinnym" },
        ],
      },
    ],
  },
  {
    name: "Steakhouse Premium",
    ownerEmail: "owner5@example.com",
    description: "Ekskluzywne steki z najlepszej wołowiny. Elegancka atmosfera, wyjątkowe doświadczenie.",
    address: "ul. Chmielna 73, Warszawa",
    phone: "+48 22 567 8901",
    slotDurationMinutes: 120,
    openDays: [2, 3, 4, 5, 6], // Tue-Sat only
    openTime: 16 * 60, // 16:00 (late afternoon/dinner)
    closeTime: 22 * 60, // 22:00
    categories: [
      {
        name: "Przystawki",
        sort: 1,
        items: [
          { name: "Tatar z Wołowiny", priceCents: 4200, description: "Surowa wołowina, kapary, korniszony, jajko" },
          { name: "Ostrygi", priceCents: 6900, description: "6 szt. świeżych ostryg z cytryną" },
          { name: "Foie Gras", priceCents: 5900, description: "Z konfiturą z fig i brioche" },
        ],
      },
      {
        name: "Steki",
        sort: 2,
        items: [
          { name: "Ribeye 300g", priceCents: 8900, description: "Marmurkowa wołowina, masło ziołowe" },
          { name: "Tenderloin 250g", priceCents: 9900, description: "Polędwica wołowa, sos pieprzowy" },
          { name: "T-Bone 500g", priceCents: 12900, description: "Klasyczny T-bone steak" },
          { name: "Tomahawk 1kg", priceCents: 19900, description: "Imponujący steak dla dwóch osób" },
        ],
      },
      {
        name: "Dodatki",
        sort: 3,
        items: [
          { name: "Ziemniaki Pieczone", priceCents: 1500, description: "Z masłem i szczypiorkiem" },
          { name: "Grillowane Warzywa", priceCents: 1800, description: "Sezonowe warzywa z rusztu" },
          { name: "Szpinak Kremowy", priceCents: 1400, description: "Ze śmietaną i czosnkiem" },
          { name: "Frytki Truflowe", priceCents: 2200, description: "Z olejem truflowym i parmezanem" },
        ],
      },
      {
        name: "Wina",
        sort: 4,
        items: [
          { name: "Czerwone Wytrawne", priceCents: 4500, description: "Kieliszek 150ml" },
          { name: "Białe Wytrawne", priceCents: 4200, description: "Kieliszek 150ml" },
          { name: "Prosecco", priceCents: 3900, description: "Kieliszek 125ml" },
        ],
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding multiple restaurants...\n");

  for (const restaurantData of restaurants) {
    console.log(`Creating ${restaurantData.name}...`);

    // Create or update owner user
    const owner = await prisma.user.upsert({
      where: { email: restaurantData.ownerEmail },
      update: { role: "OWNER" },
      create: {
        email: restaurantData.ownerEmail,
        name: `Owner of ${restaurantData.name}`,
        role: "OWNER",
        emailVerified: new Date(),
      },
    });

    // Create slug from restaurant name
    const slug = restaurantData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Calculate time slots
    const slotCount = Math.floor(
      (restaurantData.closeTime - restaurantData.openTime) / restaurantData.slotDurationMinutes
    );

    // Create restaurant with full setup
    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: owner.id,
        name: restaurantData.name,
        slug: slug,
        description: restaurantData.description,
        imageUrl: `https://picsum.photos/seed/${slug}/1200/600`,
        address: restaurantData.address,
        phone: restaurantData.phone,
        slotDurationMinutes: restaurantData.slotDurationMinutes,

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

        // Create opening hours
        hours: {
          create: restaurantData.openDays.map((weekday) => ({
            weekday,
            openMinutes: restaurantData.openTime,
            closeMinutes: restaurantData.closeTime,
          })),
        },

        // Create time slots
        timeSlots: {
          create: Array.from({ length: slotCount }, (_, i) => ({
            startMinutes: restaurantData.openTime + i * restaurantData.slotDurationMinutes,
            durationMinutes: restaurantData.slotDurationMinutes,
          })),
        },

        // Create menu categories and items
        categories: {
          create: restaurantData.categories.map((category) => ({
            name: category.name,
            sort: category.sort,
            items: {
              create: category.items.map((item) => ({
                name: item.name,
                priceCents: item.priceCents,
                description: item.description,
                isAvailable: true,
              })),
            },
          })),
        },
      },
    });

    console.log(`✅ ${restaurant.name} created`);
    console.log(`   Slug: ${restaurant.slug}`);
    console.log(`   URL: /restaurants/${restaurant.slug}\n`);
  }

  console.log("🎉 All restaurants seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
