// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const clientEmail = process.argv[2];

  if (!clientEmail) {
    console.error("❌ Usage: npm run create:client <client-email>");
    process.exit(1);
  }

  console.log(`🌱 Creating client account for ${clientEmail}...`);

  // Create or update client user
  const client = await prisma.user.upsert({
    where: { email: clientEmail },
    update: { role: "CLIENT" },
    create: {
      email: clientEmail,
      name: "Client User",
      role: "CLIENT",
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Client account created/updated: ${client.email}`);
  console.log(`   Role: ${client.role}`);
  console.log(`   Client panel: /client`);
  console.log(`\n🎉 Done! Client can now make reservations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
