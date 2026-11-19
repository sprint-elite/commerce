"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Loader2, X } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useBuilderStore } from "@/store";
import type { Order } from "@/types";
import type { User } from "@/types";

interface OrderLoadModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onPersistCanvas: () => void;
  onLoaded: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderLoadModal({
  open,
  onClose,
  user,
  onPersistCanvas,
  onLoaded,
}: OrderLoadModalProps) {
  const loadSavedPayload = useBuilderStore((s) => s.loadSavedPayload);
  const loadedOrderId = useBuilderStore((s) => s.loadedOrderId);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      const data = (await res.json()) as {
        orders?: Order[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "주문 목록을 불러오지 못했습니다.");
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록 로드 실패");
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    setError(null);
    if (user) void fetchOrders();
  }, [open, user, fetchOrders]);

  const handleLoad = async (orderId: string) => {
    if (!user) return;
    onPersistCanvas();
    setLoadingId(orderId);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = (await res.json()) as {
        order?: {
          id: string;
          orderNumber: string;
          productName: string;
          designId: string | null;
          notes: string | null;
          shippingName: string | null;
          shippingPhone: string | null;
          shippingZip: string | null;
          shippingAddress: string | null;
          design: {
            id: string;
            title: string;
            builderJson: Parameters<typeof loadSavedPayload>[0];
          } | null;
        };
        error?: string;
      };

      if (!res.ok || !data.order) {
        throw new Error(data.error ?? "주문을 불러오지 못했습니다.");
      }

      const { order } = data;
      if (!order.design?.builderJson) {
        throw new Error("이 주문에는 작업물 데이터가 없습니다.");
      }

      loadSavedPayload(order.design.builderJson, {
        id: order.design.id,
        title: order.productName,
        orderId: order.id,
        orderNumber: order.orderNumber,
        notes: order.notes ?? "",
        shippingName: order.shippingName ?? "",
        shippingPhone: order.shippingPhone ?? "",
        shippingZip: order.shippingZip ?? "",
        shippingAddress: order.shippingAddress ?? "",
      });

      onLoaded();
      setMessage(`"${order.orderNumber}" 주문 작업물을 불러왔습니다.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기 실패");
    } finally {
      setLoadingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="닫기"
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">주문 내역 불러오기</h2>
            {user && (
              <p className="mt-0.5 text-xs text-zinc-500">
                이전에 주문한 작업물을 빌더에 다시 불러옵니다
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!user ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-sm text-zinc-600">
                주문 내역을 불러오려면 로그인이 필요합니다.
              </p>
              <Link
                href="/login?next=/builder"
                className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                로그인하기
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs leading-relaxed text-zinc-500">
                주문하기를 하면 작업물이 자동으로 저장됩니다. 이전 주문을
                선택해 수정 후 다시 주문할 수 있습니다.
              </p>

              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-800">내 주문</h3>
                {loadingList && (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                )}
              </div>

              {orders.length === 0 && !loadingList ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                  아직 주문 내역이 없습니다.
                  <br />
                  작업 후 주문하기를 누르면 여기에 표시됩니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {orders.map((order) => {
                    const active = order.id === loadedOrderId;
                    const loading = loadingId === order.id;
                    const hasDesign = !!order.designId;

                    return (
                      <li
                        key={order.id}
                        className={`rounded-xl border px-3 py-3 ${
                          active
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            disabled={!!loadingId || !hasDesign}
                            onClick={() => void handleLoad(order.id)}
                            className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-sm font-semibold text-zinc-900">
                                {order.orderNumber}
                              </p>
                              <OrderStatusBadge status={order.status} />
                              {active && (
                                <span className="text-xs text-zinc-500">
                                  (현재)
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-zinc-600">
                              {order.productName}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                              {formatDate(order.createdAt)} · {order.quantity}개
                            </p>
                            {!hasDesign && (
                              <p className="mt-1 text-xs text-amber-600">
                                작업물 없음
                              </p>
                            )}
                          </button>
                          {loading && (
                            <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-zinc-400" />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface OrderLoadButtonProps {
  onOpen: () => void;
  onStartNew?: () => void;
  loadedOrderNumber?: string;
}

export function OrderLoadButton({
  onOpen,
  onStartNew,
  loadedOrderNumber,
}: OrderLoadButtonProps) {
  if (loadedOrderNumber) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpen}
          title="다른 주문 불러오기"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
        >
          <ClipboardList className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-[120px] truncate font-mono sm:max-w-[160px]">
            {loadedOrderNumber}
          </span>
        </button>
        <button
          type="button"
          onClick={onStartNew}
          className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
        >
          신규 주문
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
    >
      <ClipboardList className="h-4 w-4" />
      주문 내역 불러오기
    </button>
  );
}
