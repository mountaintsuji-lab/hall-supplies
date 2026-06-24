"use server";

import { revalidatePath } from "next/cache";
import { isReadOnlyDeploy } from "@/lib/inventory-fallback-data";

export type ConfirmCountResult =
  | {
      ok: true;
      orderQty: number;
      pendingQty: number;
      currentQty: number;
      parLevel: number;
      version: number;
      eventType: "COUNT" | "ORDER";
    }
  | { ok: false; error: string };

export type ConfirmReceiveResult =
  | {
      ok: true;
      receivedQty: number;
      currentQty: number;
      pendingQty: number;
      version: number;
    }
  | { ok: false; error: string };

async function getPendingQty(hallId: string, skuId: string): Promise<number> {
  const { prisma } = await import("@/lib/prisma");
  const result = await prisma.inventoryEvent.aggregate({
    where: {
      hallId,
      skuId,
      type: "ORDER",
      status: "REQUESTED",
    },
    _sum: { orderedQty: true },
  });
  return result._sum.orderedQty ?? 0;
}

export async function confirmCount(
  hallId: string,
  skuId: string,
  countedQty: number,
  expectedVersion: number,
): Promise<ConfirmCountResult> {
  if (isReadOnlyDeploy()) {
    return {
      ok: false,
      error:
        "DATABASE_URL が未設定のため保存できません。Neon の接続情報を .env に設定してください。",
    };
  }

  if (!Number.isInteger(countedQty) || countedQty < 0) {
    return { ok: false, error: "現数は0以上の整数で入力してください" };
  }

  const { prisma } = await import("@/lib/prisma");

  const setting = await prisma.hallSkuSetting.findUnique({
    where: { hallId_skuId: { hallId, skuId } },
  });

  if (!setting) {
    return { ok: false, error: "式場×SKUの設定が見つかりません" };
  }

  if (setting.version !== expectedVersion) {
    return {
      ok: false,
      error: "他の端末で更新されました。画面を再読込してください",
    };
  }

  const pendingQty = await getPendingQty(hallId, skuId);
  const orderQty = Math.max(0, setting.parLevel - countedQty - pendingQty);

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.hallSkuSetting.updateMany({
        where: { hallId, skuId, version: expectedVersion },
        data: {
          currentQty: countedQty,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new Error("VERSION_CONFLICT");
      }

      if (orderQty >= 1) {
        await tx.inventoryEvent.create({
          data: {
            hallId,
            skuId,
            type: "ORDER",
            countedQty,
            parLevel: setting.parLevel,
            orderedQty: orderQty,
            status: "REQUESTED",
          },
        });
      } else {
        await tx.inventoryEvent.create({
          data: {
            hallId,
            skuId,
            type: "COUNT",
            countedQty,
            parLevel: setting.parLevel,
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_CONFLICT") {
      return {
        ok: false,
        error: "他の端末で更新されました。画面を再読込してください",
      };
    }
    throw error;
  }

  revalidatePath("/");

  const newPending = orderQty >= 1 ? pendingQty + orderQty : pendingQty;

  return {
    ok: true,
    orderQty,
    pendingQty: newPending,
    currentQty: countedQty,
    parLevel: setting.parLevel,
    version: expectedVersion + 1,
    eventType: orderQty >= 1 ? "ORDER" : "COUNT",
  };
}

export async function previewOrderQty(
  hallId: string,
  skuId: string,
  countedQty: number,
): Promise<{ orderQty: number; pendingQty: number; parLevel: number } | null> {
  if (isReadOnlyDeploy()) return null;

  const { prisma } = await import("@/lib/prisma");
  const setting = await prisma.hallSkuSetting.findUnique({
    where: { hallId_skuId: { hallId, skuId } },
  });
  if (!setting) return null;

  const pendingQty = await getPendingQty(hallId, skuId);
  const orderQty = Math.max(0, setting.parLevel - countedQty - pendingQty);

  return {
    orderQty,
    pendingQty,
    parLevel: setting.parLevel,
  };
}

export async function confirmReceive(
  hallId: string,
  skuId: string,
  expectedVersion: number,
): Promise<ConfirmReceiveResult> {
  if (isReadOnlyDeploy()) {
    return {
      ok: false,
      error:
        "DATABASE_URL が未設定のため保存できません。Neon の接続情報を .env に設定してください。",
    };
  }

  const { prisma } = await import("@/lib/prisma");

  const setting = await prisma.hallSkuSetting.findUnique({
    where: { hallId_skuId: { hallId, skuId } },
  });

  if (!setting) {
    return { ok: false, error: "式場×SKUの設定が見つかりません" };
  }

  if (setting.version !== expectedVersion) {
    return {
      ok: false,
      error: "他の端末で更新されました。画面を再読込してください",
    };
  }

  const pendingOrders = await prisma.inventoryEvent.findMany({
    where: { hallId, skuId, type: "ORDER", status: "REQUESTED" },
    orderBy: { createdAt: "asc" },
  });

  const receiveQty = pendingOrders.reduce(
    (sum, order) => sum + (order.orderedQty ?? 0),
    0,
  );

  if (receiveQty < 1) {
    return { ok: false, error: "入庫待ちの発注がありません" };
  }

  try {
    const newCurrentQty = await prisma.$transaction(async (tx) => {
      const updated = await tx.hallSkuSetting.updateMany({
        where: { hallId, skuId, version: expectedVersion },
        data: {
          currentQty: { increment: receiveQty },
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new Error("VERSION_CONFLICT");
      }

      await tx.inventoryEvent.updateMany({
        where: { hallId, skuId, type: "ORDER", status: "REQUESTED" },
        data: { status: "RECEIVED" },
      });

      const after = await tx.hallSkuSetting.findUniqueOrThrow({
        where: { hallId_skuId: { hallId, skuId } },
      });

      await tx.inventoryEvent.create({
        data: {
          hallId,
          skuId,
          type: "RECEIVE",
          countedQty: after.currentQty,
          parLevel: after.parLevel,
          orderedQty: receiveQty,
        },
      });

      return after.currentQty;
    });

    revalidatePath("/");

    return {
      ok: true,
      receivedQty: receiveQty,
      currentQty: newCurrentQty,
      pendingQty: 0,
      version: expectedVersion + 1,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_CONFLICT") {
      return {
        ok: false,
        error: "他の端末で更新されました。画面を再読込してください",
      };
    }
    throw error;
  }
}
