"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { Order } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MyOrderDetailViewProps {
  order: Order;
}

export function MyOrderDetailView({ order: initial }: MyOrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const builderHref = `/builder?product=${order.productSlug}&order=${order.id}`;
  const canOpenBuilder = order.saleType === "CUSTOM";
  const canCancel =
    order.status === "PENDING" || order.status === "AWAITING_PAYMENT";

  const cancel = async () => {
    if (!confirm("이 주문을 취소할까요?")) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
      });
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok) throw new Error(data.error ?? "취소에 실패했습니다.");
      if (data.order) setOrder(data.order);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소에 실패했습니다.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-zinc-900">
            {order.orderNumber}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-bold text-zinc-900">상품</h2>
        <p className="mt-3 text-base font-semibold text-zinc-900">
          {order.productName}
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-400">구분</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {order.saleType === "CUSTOM" ? "커스텀" : "기성품"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">수량</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {order.quantity}개
            </dd>
          </div>
        </dl>
        {canOpenBuilder ? (
          <Link
            href={builderHref}
            className="mt-5 inline-flex rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            빌더에서 디자인 보기
          </Link>
        ) : null}
      </section>

      {order.notes?.trim() ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-bold text-zinc-900">요청사항</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
            {order.notes}
          </p>
        </section>
      ) : null}

      {canCancel ? (
        <button
          type="button"
          disabled={cancelling}
          onClick={() => void cancel()}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          주문 취소
        </button>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Link
        href="/mypage"
        className="inline-flex text-sm font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← 주문 목록으로
      </Link>
    </div>
  );
}
