import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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

  const ichinomiyaSku1 = await prisma.hallSkuSetting.findUnique({
    where: { hallId_skuId: { hallId: "ichinomiya", skuId: "sku-1" } },
  });

  console.log(JSON.stringify({ hallCount, skuCount, settingCount, eventCount, ichinomiyaSku1 }, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
