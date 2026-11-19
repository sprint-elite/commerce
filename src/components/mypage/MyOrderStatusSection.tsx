import Link from "next/link";
import {
  Box,
  CircleCheck,
  ClipboardList,
  Package,
  Truck,
} from "lucide-react";
import {
  countOrdersByStage,
  filterRecentOrders,
} from "@/lib/mypage-orders";
import { MyOrderTableRow, ORDER_TABLE_GRID } from "./MyOrderTableRow";
import type { Order } from "@/types";

const STAGE_ICONS = [ClipboardList, Package, Box, Truck, CircleCheck] as const;

interface MyOrderStatusSectionProps {
  orders: Order[];
  showViewMore?: boolean;
}

export function MyOrderStatusSection({
  orders,
  showViewMore = false,
}: MyOrderStatusSectionProps) {
  const recentOrders = filterRecentOrders(orders);
  const stages = countOrdersByStage(recentOrders);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-bold text-zinc-900">
          최근 1개월 구매내역
        </h2>
        {showViewMore && (
          <Link
            href="#all-orders"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
          >
            더보기
          </Link>
        )}
      </div>

      <div className="grid grid-cols-5 divide-x divide-zinc-100 border-b border-zinc-100">
        {stages.map((stage, index) => {
          const Icon = STAGE_ICONS[index];
          return (
            <div
              key={stage.key}
              className="flex flex-col items-center gap-2 px-2 py-5 sm:px-4"
            >
              <span className="text-xl font-bold tabular-nums text-zinc-900 sm:text-2xl">
                {stage.count}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="text-center text-[10px] font-medium leading-tight text-zinc-600 sm:text-xs">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className={`hidden gap-4 border-b border-zinc-100 bg-zinc-50 px-6 py-3 text-xs font-semibold text-zinc-500 sm:grid ${ORDER_TABLE_GRID}`}
      >
        <span>주문일자 / 주문번호</span>
        <span>상품정보</span>
        <span className="text-center">수량</span>
        <span className="text-center">주문상태</span>
        <span className="text-center" />
      </div>

      {recentOrders.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm text-zinc-500">
            최근 1개월 이내 구매내역이 없습니다.
          </p>
          <Link
            href="/#products"
            className="mt-5 inline-flex rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            상품 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {recentOrders.map((order) => (
            <li key={order.id} className="transition-colors hover:bg-zinc-50">
              <MyOrderTableRow order={order} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
