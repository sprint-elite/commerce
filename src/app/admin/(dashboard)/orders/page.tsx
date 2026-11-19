import { Suspense } from "react";
import { AdminOrderList } from "@/components/admin/AdminOrderList";
import { fetchOrdersForAdmin } from "@/lib/orders";

export default async function AdminOrdersPage() {
  const orders = await fetchOrdersForAdmin();
  return (
    <Suspense
      fallback={
        <div className="px-6 py-16 text-center text-sm text-slate-500">
          주문 목록 불러오는 중…
        </div>
      }
    >
      <AdminOrderList orders={orders} />
    </Suspense>
  );
}
