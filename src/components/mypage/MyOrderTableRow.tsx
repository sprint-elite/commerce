import Link from "next/link";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { Order } from "@/types";

export const ORDER_TABLE_GRID =
  "sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_72px_88px_96px]";

interface MyOrderTableRowProps {
  order: Order;
}

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function MyOrderTableRow({ order }: MyOrderTableRowProps) {
  const detailHref = `/mypage/orders/${order.id}`;
  const builderHref = `/builder?product=${order.productSlug}&order=${order.id}`;

  return (
    <div
      className={`grid gap-3 px-5 py-4 sm:items-center sm:gap-4 sm:px-6 sm:py-5 ${ORDER_TABLE_GRID}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">
          {formatOrderDate(order.createdAt)}
        </p>
        <p className="mt-0.5 truncate font-mono text-xs text-zinc-500">
          {order.orderNumber}
        </p>
      </div>

      <p className="min-w-0 text-sm font-medium text-zinc-900">
        {order.productName}
      </p>

      <p className="text-sm text-zinc-700 sm:text-center">{order.quantity}개</p>

      <p className="text-sm font-medium text-sky-600 sm:text-center">
        {ORDER_STATUS_LABELS[order.status]}
      </p>

      <div className="flex flex-wrap gap-1.5 sm:justify-center">
        <Link
          href={detailHref}
          className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
        >
          상세
        </Link>
        {order.saleType === "CUSTOM" ? (
          <Link
            href={builderHref}
            className="inline-flex rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            빌더
          </Link>
        ) : null}
      </div>
    </div>
  );
}
