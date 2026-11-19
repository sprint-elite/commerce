import { MyOrderTableRow, ORDER_TABLE_GRID } from "./MyOrderTableRow";
import type { Order } from "@/types";

interface MyOrderHistoryTableProps {
  orders: Order[];
}

export function MyOrderHistoryTable({ orders }: MyOrderHistoryTableProps) {
  if (orders.length === 0) return null;

  return (
    <section
      id="all-orders"
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
    >
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-bold text-zinc-900">전체 주문내역</h2>
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

      <ul className="divide-y divide-zinc-100">
        {orders.map((order) => (
          <li key={order.id} className="transition-colors hover:bg-zinc-50">
            <MyOrderTableRow order={order} />
          </li>
        ))}
      </ul>
    </section>
  );
}
