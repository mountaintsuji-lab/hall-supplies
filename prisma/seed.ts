import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { YAMATE_SKUS } from "../src/data/yamate-skus";
import { HALLS, PILOT_HALL_ID } from "../src/lib/halls";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.inventoryEvent.deleteMany();
  await prisma.hallSkuSetting.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.hall.deleteMany();

  for (const hall of HALLS) {
    await prisma.hall.create({ data: hall });
  }

  await prisma.sku.createMany({
    data: YAMATE_SKUS.map((sku) => ({
      id: sku.id,
      name: sku.name,
      unit: sku.unit,
      category: sku.category,
      imageEmoji: sku.imageEmoji,
    })),
  });

  await prisma.hallSkuSetting.createMany({
    data: YAMATE_SKUS.map((sku) => ({
      hallId: PILOT_HALL_ID,
      skuId: sku.id,
      parLevel: sku.parLevel,
      currentQty: 0,
    })),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`Seeded ${YAMATE_SKUS.length} SKUs for ${PILOT_HALL_ID}`);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
