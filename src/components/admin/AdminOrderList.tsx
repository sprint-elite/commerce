"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Loader2,
  PackageSearch,
  Search,
} from "lucide-react";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
} from "@/lib/order-status";
import type { ProductSaleType } from "@/lib/product-sale-type";
import type { Order, OrderStatus } from "@/types";

const STATUS_FILTERS: { key: OrderStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "PENDING", label: "대기" },
  { key: "AWAITING_PAYMENT", label: "접수" },
  { key: "CONFIRMED", label: "확인됨" },
  { key: "IN_PRODUCTION", label: "제작 중" },
  { key: "SHIPPED", label: "작업 완료" },
  { key: "DELIVERED", label: "종료" },
  { key: "CANCELLED", label: "취소" },
];

type SaleFilter = "ALL" | ProductSaleType;

const filterSelectClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isTodoOrder(o: Order) {
  if (o.status === "PENDING" || o.status === "AWAITING_PAYMENT") return true;
  if (o.status === "CONFIRMED" || o.status === "IN_PRODUCTION") return true;
  return false;
}

async function patchOrder(
  id: string,
  body: {
    status?: OrderStatus;
  },
): Promise<Order> {
  const res = await fetch(`/api/admin/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { order?: Order; error?: string };
  if (!res.ok || !data.order) {
    throw new Error(data.error ?? "저장 실패");
  }
  return data.order;
}

function SaleTypeBadge({ saleType }: { saleType: ProductSaleType }) {
  const custom = saleType === "CUSTOM";
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
        custom
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {custom ? "커스텀" : "기성"}
    </span>
  );
}

interface AdminOrderListProps {
  orders: Order[];
}

export function AdminOrderList({ orders }: AdminOrderListProps) {
  const searchParams = useSearchParams();
  const [orderList, setOrderList] = useState(orders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [saleFilter, setSaleFilter] = useState<SaleFilter>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrderList(orders);
  }, [orders]);

  useEffect(() => {
    const fromQuery = searchParams.get("order");
    if (fromQuery) setSelectedOrderId(fromQuery);
  }, [searchParams]);

  const updateOrder = (order: Order) => {
    setOrderList((prev) => prev.map((o) => (o.id === order.id ? order : o)));
  };

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();

    return orderList
      .filter((o) => statusFilter === "ALL" || o.status === statusFilter)
      .filter((o) => saleFilter === "ALL" || o.saleType === saleFilter)
      .filter((o) => {
        if (!q) return true;
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          (o.shippingName?.toLowerCase().includes(q) ?? false) ||
          (o.shippingPhone?.includes(q) ?? false) ||
          o.productName.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orderList, query, statusFilter, saleFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orderList.length };
    for (const o of orderList) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return counts;
  }, [orderList]);

  const todoCount = useMemo(
    () => orderList.filter(isTodoOrder).length,
    [orderList],
  );

  const runAction = async (id: string, action: () => Promise<Order>) => {
    setBusyId(id);
    setError(null);
    try {
      const order = await action();
      updateOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리 실패");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          주문 목록
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          상태 변경을 목록에서 바로 처리할 수 있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              총 <span className="font-semibold text-slate-900">{orderList.length}</span>
              건 · 처리할 일{" "}
              <span className="font-semibold text-amber-700">{todoCount}</span>건
            </p>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
              <div className="relative min-w-[200px] flex-1 lg:w-72 lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="주문번호, 고객, 연락처, 상품"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                />
              </div>
              <select
                value={saleFilter}
                onChange={(e) => setSaleFilter(e.target.value as SaleFilter)}
                className={filterSelectClass}
                aria-label="상품 구분"
              >
                <option value="ALL">구분 전체</option>
                <option value="CUSTOM">커스텀</option>
                <option value="READYMADE">기성</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
            {STATUS_FILTERS.map((f) => {
              const count = statusCounts[f.key] ?? 0;
              const active = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {f.label}
                  <span
                    className={`ml-1.5 tabular-nums ${active ? "text-slate-300" : "text-slate-400"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <PackageSearch className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              {orderList.length === 0
                ? "아직 접수된 주문이 없습니다"
                : "검색 결과가 없습니다"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
                    <th className="px-4 py-3">주문</th>
                    <th className="px-3 py-3">구분</th>
                    <th className="px-3 py-3">고객</th>
                    <th className="px-3 py-3">상품</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">주문일</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => {
                    const busy = busyId === order.id;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className="group cursor-pointer hover:bg-slate-50/80"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              {order.orderNumber}
                            </span>
                            {order.notes?.trim() ? (
                              <FileText
                                className="h-3.5 w-3.5 text-amber-500"
                                aria-label="요청사항 있음"
                              />
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <SaleTypeBadge saleType={order.saleType} />
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-slate-800">
                            {order.customerName}
                          </p>
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-3 text-slate-600">
                          {order.productName}
                          <span className="ml-1 text-slate-400">
                            ×{order.quantity}
                          </span>
                        </td>
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={order.status}
                            disabled={busy}
                            onChange={(e) =>
                              void runAction(order.id, () =>
                                patchOrder(order.id, {
                                  status: e.target.value as OrderStatus,
                                }),
                              )
                            }
                            className="max-w-[7rem] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-900 disabled:opacity-50"
                          >
                            {ORDER_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {ORDER_STATUS_LABELS[opt.value]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {filteredOrders.map((order) => {
                const busy = busyId === order.id;
                return (
                  <div key={order.id} className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-sm font-semibold text-slate-900">
                            {order.orderNumber}
                            {order.notes?.trim() ? (
                              <FileText className="ml-1 inline h-3.5 w-3.5 text-amber-500" />
                            ) : null}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {order.customerName}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {order.productName} ×{order.quantity}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <SaleTypeBadge saleType={order.saleType} />
                          <OrderStatusBadge status={order.status} />
                        </div>
                      </div>
                    </button>
                    <div
                      className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={order.status}
                        disabled={busy}
                        onChange={(e) =>
                          void runAction(order.id, () =>
                            patchOrder(order.id, {
                              status: e.target.value as OrderStatus,
                            }),
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900"
                      >
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {ORDER_STATUS_LABELS[opt.value]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onOrderUpdated={(order) => updateOrder(order)}
      />
    </div>
  );
}
