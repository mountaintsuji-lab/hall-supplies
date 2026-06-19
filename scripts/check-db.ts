import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { YAMATE_SKUS } from "../src/data/yamate-skus";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const [hallCount, skuCount, settingCount, eventCount] = await Promise.all([
    prisma.hall.count(),
    prisma.sku.count(),
    prisma.hallSkuSetting.count(),
    prisma.inventoryEvent.count(),
  ]);

  const sampleSkuId = YAMATE_SKUS[0]?.id ?? "";
  const yamateSample = await prisma.hallSkuSetting.findUnique({
    where: { hallId_skuId: { hallId: "yamate", skuId: sampleSkuId } },
  });

  console.log(JSON.stringify({ hallCount, skuCount, settingCount, eventCount, yamateSample }, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
