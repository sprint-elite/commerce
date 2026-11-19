import type { Order } from "@/types";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderListProps {
  orders: Order[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500">
        주문 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              주문번호
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              고객
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              상품
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              수량
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              상태
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              주문일
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-zinc-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                {order.orderNumber}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {order.customerName}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-600">
                {order.productName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                {order.quantity}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                {formatDate(order.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
