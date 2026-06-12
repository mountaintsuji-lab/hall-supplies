import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
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

  const skus = [
    {
      id: "sku-1",
      name: "短寸線香",
      unit: "箱",
      category: "消耗品",
      imageEmoji: "🕯️",
    },
    {
      id: "sku-2",
      name: "HDMIケーブル（3m）",
      unit: "本",
      category: "音響・映像",
      imageEmoji: "🔌",
    },
    {
      id: "sku-3",
      name: "会葬御礼ハンドタオル",
      unit: "箱",
      category: "消耗品",
      imageEmoji: "🧻",
    },
    {
      id: "sku-4",
      name: "短寸線香",
      unit: "箱",
      category: "消耗品",
      imageEmoji: "🕯️",
    },
  ];

  for (const sku of skus) {
    await prisma.sku.create({ data: sku });
  }

  const settings = [
    { hallId: PILOT_HALL_ID, skuId: "sku-1", parLevel: 20, currentQty: 12 },
    { hallId: PILOT_HALL_ID, skuId: "sku-2", parLevel: 15, currentQty: 28 },
    { hallId: PILOT_HALL_ID, skuId: "sku-3", parLevel: 24, currentQty: 6 },
    { hallId: "minokamo", skuId: "sku-4", parLevel: 20, currentQty: 30 },
  ];

  for (const setting of settings) {
    await prisma.hallSkuSetting.create({ data: setting });
  }

  await prisma.inventoryEvent.createMany({
    data: [
      {
        hallId: PILOT_HALL_ID,
        skuId: "sku-1",
        type: "ORDER",
        countedQty: 10,
        parLevel: 20,
        orderedQty: 10,
        status: "REQUESTED",
        createdAt: new Date("2026-05-10T09:00:00"),
      },
      {
        hallId: PILOT_HALL_ID,
        skuId: "sku-1",
        type: "COUNT",
        countedQty: 12,
        parLevel: 20,
        createdAt: new Date("2026-05-12T11:05:00"),
      },
      {
        hallId: PILOT_HALL_ID,
        skuId: "sku-3",
        type: "COUNT",
        countedQty: 6,
        parLevel: 24,
        createdAt: new Date("2026-05-01T16:40:00"),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
