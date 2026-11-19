import type { Order, OrderStatus } from "@/types";

export const ORDER_TRACKER_STAGES = [
  {
    key: "received",
    label: "접수",
    statuses: ["PENDING", "AWAITING_PAYMENT"] as OrderStatus[],
  },
  {
    key: "confirmed",
    label: "제작준비",
    statuses: ["CONFIRMED"] as OrderStatus[],
  },
  {
    key: "production",
    label: "제작중",
    statuses: ["IN_PRODUCTION"] as OrderStatus[],
  },
  {
    key: "shipped",
    label: "작업 완료",
    statuses: ["SHIPPED"] as OrderStatus[],
  },
  {
    key: "delivered",
    label: "종료",
    statuses: ["DELIVERED"] as OrderStatus[],
  },
] as const;

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function isWithinLastMonth(iso: string, now = Date.now()) {
  return now - new Date(iso).getTime() <= ONE_MONTH_MS;
}

export function filterRecentOrders(orders: Order[], now = Date.now()) {
  return orders.filter((order) => isWithinLastMonth(order.createdAt, now));
}

export function countOrdersByStage(orders: Order[]) {
  return ORDER_TRACKER_STAGES.map((stage) => ({
    ...stage,
    count: orders.filter((order) => stage.statuses.includes(order.status))
      .length,
  }));
}
