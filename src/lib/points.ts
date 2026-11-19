import { prisma } from "@/lib/db";

/** 주문 접수 시 적립 (주문 금액 1%) */
export async function earnPointsForOrder(input: {
  userId: string;
  orderId: string;
  orderTotal: number;
  orderNumber: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { isGuest: true, pointsBalance: true, deletedAt: true },
  });
  if (!user || user.isGuest || user.deletedAt) return null;

  const amount = Math.floor(input.orderTotal * 0.01);
  if (amount <= 0) return null;

  const existing = await prisma.pointLedger.findFirst({
    where: { orderId: input.orderId, type: "EARN" },
  });
  if (existing) return existing;

  const balance = user.pointsBalance + amount;
  const [ledger] = await prisma.$transaction([
    prisma.pointLedger.create({
      data: {
        userId: input.userId,
        type: "EARN",
        amount,
        balance,
        reason: `주문 ${input.orderNumber} 적립`,
        orderId: input.orderId,
      },
    }),
    prisma.user.update({
      where: { id: input.userId },
      data: { pointsBalance: balance },
    }),
  ]);
  return ledger;
}

/** 결제 확정 시 주문에 묶인 포인트 차감 */
export async function spendPointsForOrder(input: {
  userId: string;
  orderId: string;
  amount: number;
  orderNumber: string;
}) {
  if (input.amount <= 0) return null;

  const existing = await prisma.pointLedger.findFirst({
    where: { orderId: input.orderId, type: "SPEND" },
  });
  if (existing) return existing;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { pointsBalance: true, isGuest: true },
  });
  if (!user || user.isGuest) return null;
  if (user.pointsBalance < input.amount) {
    throw new Error("보유 포인트가 부족합니다.");
  }

  const balance = user.pointsBalance - input.amount;
  const [ledger] = await prisma.$transaction([
    prisma.pointLedger.create({
      data: {
        userId: input.userId,
        type: "SPEND",
        amount: -input.amount,
        balance,
        reason: `주문 ${input.orderNumber} 사용`,
        orderId: input.orderId,
      },
    }),
    prisma.user.update({
      where: { id: input.userId },
      data: { pointsBalance: balance },
    }),
  ]);
  return ledger;
}

/** 환불 시 포인트 사용분 복구 + 적립분 회수 */
export async function reversePointsForOrder(input: {
  userId: string;
  orderId: string;
  orderNumber: string;
}) {
  const ledgers = await prisma.pointLedger.findMany({
    where: { orderId: input.orderId },
  });
  if (ledgers.length === 0) return;

  const already = await prisma.pointLedger.findFirst({
    where: {
      orderId: input.orderId,
      type: "ADJUST",
      reason: { contains: "환불" },
    },
  });
  if (already) return;

  let delta = 0;
  for (const l of ledgers) {
    if (l.type === "SPEND") delta += Math.abs(l.amount);
    if (l.type === "EARN") delta -= Math.abs(l.amount);
  }
  if (delta === 0) return;

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return;
  const next = Math.max(0, user.pointsBalance + delta);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { pointsBalance: next },
    }),
    prisma.pointLedger.create({
      data: {
        userId: input.userId,
        type: "ADJUST",
        amount: next - user.pointsBalance,
        balance: next,
        reason: `주문 ${input.orderNumber} 환불 포인트 조정`,
        orderId: input.orderId,
      },
    }),
  ]);
}

export async function adjustPoints(input: {
  userId: string;
  amount: number;
  reason: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new Error("사용자를 찾을 수 없습니다.");

  const next = Math.max(0, user.pointsBalance + input.amount);
  const delta = next - user.pointsBalance;
  if (delta === 0) return null;

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: { pointsBalance: next },
    });
    return tx.pointLedger.create({
      data: {
        userId: input.userId,
        type: "ADJUST",
        amount: delta,
        balance: next,
        reason: input.reason,
      },
    });
  });
}
