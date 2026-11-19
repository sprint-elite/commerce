import { prisma } from "@/lib/db";
import { toOrderDto } from "@/lib/orders";
import type { Order, OrderStatus } from "@/types";
import type { PaymentStatus } from "@/lib/payment-status";

export type DailyTrendPoint = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

export type StatusBreakdown = {
  status: OrderStatus;
  count: number;
};

export type PaymentBreakdown = {
  status: PaymentStatus;
  count: number;
};

export type TopProductRow = {
  productId: string;
  productName: string;
  slug: string;
  orderCount: number;
  revenue: number;
};

export type ReworkMonthPoint = {
  key: string;
  label: string;
  workCount: number;
  commentCount: number;
};

export type ComplianceMonthPoint = {
  key: string;
  label: string;
  shippedCount: number;
  onTimeCount: number;
  /** 해당 월 출하 기준 준수율. 출하 0건이면 null */
  compliancePercent: number | null;
};

export type QualityMetrics = {
  /** 고객 코멘트가 달린 작업 건수 / 전체 작업 건수 × 100 */
  reworkRatePercent: number;
  reworkOrderCount: number;
  totalWorkOrderCount: number;
  reworkGoalPercent: number;
  reworkMonthly: ReworkMonthPoint[];
  /**
   * 납기 준수율(%).
   * 납기 = 주문 등록 + 7일. 배송중(SHIPPED) 변경 시각이 납기 이전이면 준수.
   */
  deliveryCompliancePercent: number | null;
  /** 납기 내 출하 건수 */
  onTimeShipCount: number;
  /** 출하(배송중) 판정에 포함된 건수 */
  shippedSampleCount: number;
  complianceGoalPercent: number;
  complianceMonthly: ComplianceMonthPoint[];
};

export type AdminDashboardData = {
  summary: {
    todayOrders: number;
    todayRevenue: number;
    weekOrders: number;
    weekRevenue: number;
    monthRevenue: number;
    totalOrders: number;
    totalRevenue: number;
    unpaidCount: number;
    unpaidAmount: number;
    todoCount: number;
    inProductionCount: number;
    shippedCount: number;
    activeProducts: number;
    totalProducts: number;
    totalCustomers: number;
    totalCategories: number;
  };
  quality: QualityMetrics;
  statusBreakdown: StatusBreakdown[];
  paymentBreakdown: PaymentBreakdown[];
  dailyTrend: DailyTrendPoint[];
  todoOrders: Order[];
  recentOrders: Order[];
  topProducts: TopProductRow[];
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function daysAgo(n: number) {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
}

function startOfMonthOffset(monthsAgo: number) {
  const x = startOfMonth();
  x.setMonth(x.getMonth() - monthsAgo);
  return x;
}

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(key: string) {
  const month = Number(key.slice(5, 7));
  return `${month}월`;
}

function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function isTodoOrder(o: {
  paymentStatus: string;
  status: string;
  trackingNumber: string | null;
}) {
  if (o.status === "PENDING" || o.status === "AWAITING_PAYMENT") return true;
  if (o.status === "CONFIRMED" || o.status === "IN_PRODUCTION") return true;
  return false;
}

const orderInclude = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true, slug: true, saleType: true } },
  items: true,
} as const;

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const today = startOfDay();
  const week = startOfWeek();
  const month = startOfMonth();
  const trendStart = daysAgo(6);

  const notCancelled = { status: { not: "CANCELLED" as const } };

  const [
    todayOrders,
    todayRevenueAgg,
    weekOrders,
    weekRevenueAgg,
    monthRevenueAgg,
    totalRevenueAgg,
    totalOrders,
    unpaidAgg,
    unpaidAmountAgg,
    inProductionCount,
    shippedCount,
    activeProducts,
    totalProducts,
    totalCustomers,
    totalCategories,
    statusGroups,
    paymentGroups,
    recentRaw,
    todoCandidates,
    trendRaw,
    topGrouped,
    totalWorkOrderCount,
    reworkOrderCount,
    shippedLeadRows,
    reworkChartOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: today }, ...notCancelled },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, ...notCancelled },
      _sum: { totalPrice: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: week }, ...notCancelled },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: week }, ...notCancelled },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: month }, ...notCancelled },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: notCancelled,
      _sum: { totalPrice: true },
    }),
    prisma.order.count(),
    prisma.order.count({
      where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
      _sum: { totalPrice: true },
    }),
    prisma.order.count({ where: { status: "IN_PRODUCTION" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.category.count(),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: { id: true },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
          { status: "CONFIRMED" },
          { status: "IN_PRODUCTION" },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 12,
      include: orderInclude,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: trendStart }, ...notCancelled },
      select: { createdAt: true, totalPrice: true },
    }),
    prisma.order.groupBy({
      by: ["productId"],
      where: notCancelled,
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    /** 현재 등록된 작업 건수 (취소 제외) */
    prisma.order.count({ where: notCancelled }),
    /** 고객 코멘트가 1건 이상 달린 작업 건수 */
    prisma.order.count({
      where: {
        ...notCancelled,
        comments: {
          some: {
            user: { role: "CUSTOMER" },
          },
        },
      },
    }),
    /** 출하·납기 준수 산출용 */
    prisma.order.findMany({
      where: {
        ...notCancelled,
        OR: [
          { shippedAt: { not: null } },
          { status: { in: ["SHIPPED", "DELIVERED"] } },
        ],
      },
      select: {
        createdAt: true,
        shippedAt: true,
        updatedAt: true,
        status: true,
      },
    }),
    /** 최근 6개월 재작업률 차트용 */
    prisma.order.findMany({
      where: {
        ...notCancelled,
        createdAt: { gte: startOfMonthOffset(5) },
      },
      select: {
        createdAt: true,
        comments: {
          where: { user: { role: "CUSTOMER" } },
          select: { id: true },
          take: 1,
        },
      },
    }),
  ]);

  const productIds = topGrouped.map((g) => g.productId);
  const productRows =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  const topProducts: TopProductRow[] = topGrouped.map((g) => {
    const p = productMap.get(g.productId);
    return {
      productId: g.productId,
      productName: p?.name ?? "알 수 없음",
      slug: p?.slug ?? "",
      orderCount: g._count.id,
      revenue: g._sum.totalPrice ?? 0,
    };
  });

  const trendBuckets = new Map<string, { orders: number; revenue: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    trendBuckets.set(key, { orders: 0, revenue: 0 });
  }
  for (const row of trendRaw) {
    const key = startOfDay(row.createdAt).toISOString().slice(0, 10);
    const bucket = trendBuckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += row.totalPrice;
    }
  }
  const dailyTrend: DailyTrendPoint[] = [...trendBuckets.entries()].map(
    ([date, v]) => ({
      date,
      label: formatDayLabel(date),
      orders: v.orders,
      revenue: v.revenue,
    }),
  );

  const todoDtos = todoCandidates.map(toOrderDto).filter(isTodoOrder);
  const todoOrders = todoDtos.slice(0, 8);

  const reworkRatePercent =
    totalWorkOrderCount > 0
      ? Math.round((reworkOrderCount / totalWorkOrderCount) * 1000) / 10
      : 0;

  const LEAD_DAYS = 7;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const shippedSamples = shippedLeadRows
    .map((row) => {
      const shippedAt =
        row.shippedAt ??
        (row.status === "SHIPPED" || row.status === "DELIVERED"
          ? row.updatedAt
          : null);
      if (!shippedAt) return null;
      const dueAt = new Date(row.createdAt.getTime() + LEAD_DAYS * MS_PER_DAY);
      return { shippedAt, dueAt };
    })
    .filter(
      (row): row is { shippedAt: Date; dueAt: Date } => row != null,
    );

  const onTimeShipCount = shippedSamples.filter(
    (row) => row.shippedAt.getTime() <= row.dueAt.getTime(),
  ).length;

  const deliveryCompliancePercent =
    shippedSamples.length > 0
      ? Math.round((onTimeShipCount / shippedSamples.length) * 1000) / 10
      : null;

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    monthKeys.push(monthKey(startOfMonthOffset(i)));
  }

  const reworkBuckets = new Map(
    monthKeys.map((key) => [key, { workCount: 0, commentCount: 0 }]),
  );
  for (const row of reworkChartOrders) {
    const key = monthKey(row.createdAt);
    const bucket = reworkBuckets.get(key);
    if (!bucket) continue;
    bucket.workCount += 1;
    if (row.comments.length > 0) bucket.commentCount += 1;
  }
  const reworkMonthly: ReworkMonthPoint[] = monthKeys.map((key) => {
    const bucket = reworkBuckets.get(key)!;
    return {
      key,
      label: monthLabel(key),
      workCount: bucket.workCount,
      commentCount: bucket.commentCount,
    };
  });

  const complianceBuckets = new Map(
    monthKeys.map((key) => [key, { shippedCount: 0, onTimeCount: 0 }]),
  );
  for (const row of shippedLeadRows) {
    const shippedAt =
      row.shippedAt ??
      (row.status === "SHIPPED" || row.status === "DELIVERED"
        ? row.updatedAt
        : null);
    if (!shippedAt) continue;
    const key = monthKey(shippedAt);
    const bucket = complianceBuckets.get(key);
    if (!bucket) continue;
    bucket.shippedCount += 1;
    const dueAt = new Date(row.createdAt.getTime() + LEAD_DAYS * MS_PER_DAY);
    if (shippedAt.getTime() <= dueAt.getTime()) bucket.onTimeCount += 1;
  }
  const complianceMonthly: ComplianceMonthPoint[] = monthKeys.map((key) => {
    const bucket = complianceBuckets.get(key)!;
    return {
      key,
      label: monthLabel(key),
      shippedCount: bucket.shippedCount,
      onTimeCount: bucket.onTimeCount,
      compliancePercent:
        bucket.shippedCount > 0
          ? Math.round((bucket.onTimeCount / bucket.shippedCount) * 1000) / 10
          : null,
    };
  });

  const quality: QualityMetrics = {
    reworkRatePercent,
    reworkOrderCount,
    totalWorkOrderCount,
    reworkGoalPercent: 3,
    reworkMonthly,
    deliveryCompliancePercent,
    onTimeShipCount,
    shippedSampleCount: shippedSamples.length,
    complianceGoalPercent: 95,
    complianceMonthly,
  };

  return {
    summary: {
      todayOrders,
      todayRevenue: todayRevenueAgg._sum.totalPrice ?? 0,
      weekOrders,
      weekRevenue: weekRevenueAgg._sum.totalPrice ?? 0,
      monthRevenue: monthRevenueAgg._sum.totalPrice ?? 0,
      totalOrders,
      totalRevenue: totalRevenueAgg._sum.totalPrice ?? 0,
      unpaidCount: unpaidAgg,
      unpaidAmount: unpaidAmountAgg._sum.totalPrice ?? 0,
      todoCount: todoDtos.length,
      inProductionCount,
      shippedCount,
      activeProducts,
      totalProducts,
      totalCustomers,
      totalCategories,
    },
    quality,
    statusBreakdown: statusGroups.map((g) => ({
      status: g.status as OrderStatus,
      count: g._count.id,
    })),
    paymentBreakdown: paymentGroups.map((g) => ({
      status: g.paymentStatus as PaymentStatus,
      count: g._count.id,
    })),
    dailyTrend,
    todoOrders,
    recentOrders: recentRaw.map(toOrderDto),
    topProducts,
  };
}
