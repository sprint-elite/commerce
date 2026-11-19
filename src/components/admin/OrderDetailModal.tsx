"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  ExternalLink,
  ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  X,
} from "lucide-react";
import { DesignPreviewPanel } from "./DesignPreviewPanel";
import { ArtworkDownloadPanel } from "./ArtworkDownloadPanel";
import { AnnotationListReadonly } from "./AnnotationListReadonly";
import { OrderStatusSelect } from "@/components/orders/OrderStatusSelect";
import { OrderCommentForm } from "@/components/orders/OrderCommentForm";
import { OrderCommentList } from "@/components/orders/OrderCommentList";
import { buildAdminBuilderHref } from "@/lib/admin-builder";
import type { Order, OrderComment, OrderDetail, OrderStatus } from "@/types";
import type { SavedBuilderPayload } from "@/types/saved-design";
import type { ViewSide } from "@/types/builder";
import {
  APPROVAL_STATUS_LABELS,
  BAG_COLOR_LABELS,
  FABRIC_LABELS,
  HANDLE_LABELS,
  POCKET_LABELS,
  PRINT_SIDE_LABELS,
  PRODUCT_TYPE_LABELS,
  SIZE_LABELS,
  type AnnotationStatus,
} from "@/types/builder";

type TabKey = "design" | "order" | "annotations" | "comments";
type OrderSubTabKey = "customer" | "payment" | "product";

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated?: (order: Order) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailModal({
  orderId,
  onClose,
  onOrderUpdated,
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("design");
  const [orderSubTab, setOrderSubTab] = useState<OrderSubTabKey>("customer");
  const [previewSide, setPreviewSide] = useState<ViewSide>("front");
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null,
  );
  const [comments, setComments] = useState<OrderComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadComments = useCallback(async (id: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}/comments`);
      const data = (await res.json()) as {
        comments?: OrderComment[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "코멘트 로드 실패");
      setComments(data.comments ?? []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const handleStatusChange = useCallback(
    async (status: OrderStatus) => {
      if (!orderId) return;
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { order?: OrderDetail; error?: string };
      if (!res.ok) throw new Error(data.error ?? "상태 변경 실패");
      if (data.order) {
        setOrder((prev) =>
          prev ? { ...prev, status: data.order!.status } : prev,
        );
        onOrderUpdated?.(data.order);
      }
    },
    [orderId, onOrderUpdated],
  );

  const handlePostComment = useCallback(
    async (message: string) => {
      if (!orderId) return;
      const res = await fetch(`/api/orders/${orderId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as {
        comment?: OrderComment;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "코멘트 등록 실패");
      if (data.comment) {
        setComments((prev) => [...prev, data.comment!]);
      } else {
        await loadComments(orderId);
      }
    },
    [orderId, loadComments],
  );

  const handleAnnotationStatusChange = useCallback(
    async (annotationId: string, status: AnnotationStatus) => {
      if (!orderId) return;
      const res = await fetch(`/api/orders/${orderId}/annotations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotationId, status }),
      });
      const data = (await res.json()) as {
        order?: OrderDetail;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "작업 요청 상태 변경 실패");
      if (data.order) {
        setOrder(data.order);
        onOrderUpdated?.(data.order);
      }
    },
    [orderId, onOrderUpdated],
  );

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = (await res.json()) as {
        order?: OrderDetail;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "주문 정보를 불러오지 못했습니다.");
      setOrder(data.order ?? null);
      if (data.order?.design) {
        setPreviewSide(data.order.design.builderJson.currentSide);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로드 실패");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setError(null);
      setTab("design");
      setOrderSubTab("customer");
      setActiveAnnotationId(null);
      setComments([]);
      return;
    }
    void fetchDetail(orderId);
    void loadComments(orderId);
  }, [orderId, fetchDetail, loadComments]);

  if (!orderId) return null;

  const payload = order?.design?.builderJson;
  const annotations = payload?.annotations ?? [];

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "design", label: "작업물", icon: ImageIcon },
    { key: "order", label: "주문 상세", icon: ClipboardList },
    {
      key: "annotations",
      label: `작업 요청${annotations.length > 0 ? ` (${annotations.length})` : ""}`,
      icon: MapPin,
    },
    {
      key: "comments",
      label: `Comment${comments.length > 0 ? ` (${comments.length})` : ""}`,
      icon: MessageSquare,
    },
  ];

  const handleAnnotationSelect = (id: string, side: ViewSide) => {
    setActiveAnnotationId(id);
    setPreviewSide(side);
  };

  const renderRightPanel = () => {
    if (!order) return null;

    if (tab === "design") {
      return (
        <>
          <h3 className="text-sm font-semibold text-slate-900">작업물 정보</h3>
          {payload ? (
            <dl className="mt-3 space-y-2.5 text-sm">
              <DetailRow label="작업명" value={order.design?.title ?? "-"} />
              <DetailRow label="작업번호" value={payload.orderNo} mono />
              <DetailRow
                label="승인 상태"
                value={APPROVAL_STATUS_LABELS[payload.approvalStatus]}
              />
              <DetailRow
                label="가방 색상"
                value={BAG_COLOR_LABELS[payload.options.bagColor]}
              />
              <DetailRow
                label="작업 요청"
                value={`${annotations.length}건 (미처리 ${annotations.filter((a) => a.status === "open").length}건)`}
              />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              디자인 데이터가 연결되지 않은 주문입니다.
            </p>
          )}
          {order.design && (
            <Link
              href={buildAdminBuilderHref({
                productSlug: order.productSlug,
                orderId: order.id,
              })}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              빌더에서 수정하기
            </Link>
          )}
          {annotations.length > 0 && (
            <button
              type="button"
              onClick={() => setTab("annotations")}
              className="mt-3 text-xs font-medium text-indigo-600 hover:underline"
            >
              작업 요청 전체 보기 →
            </button>
          )}
          {payload && (
            <ArtworkDownloadPanel
              orderNumber={order.orderNumber}
              payload={payload}
              currentSide={previewSide}
            />
          )}
        </>
      );
    }

    if (tab === "order") {
      return (
        <OrderDetailSubPanel
          order={order}
          payload={payload}
          subTab={orderSubTab}
          onSubTabChange={setOrderSubTab}
        />
      );
    }

    if (tab === "annotations") {
      return (
        <AnnotationListReadonly
          annotations={annotations}
          activeId={activeAnnotationId}
          onSelect={handleAnnotationSelect}
          onStatusChange={handleAnnotationStatusChange}
        />
      );
    }

    return (
      <div className="-m-5 flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-sm font-semibold text-slate-900">작업 코멘트</h3>
          <p className="mt-1 text-xs text-slate-500">
            고객에게 빌더 Comment 탭에 표시됩니다.
          </p>
          <div className="mt-4">
            <OrderCommentList
              comments={comments}
              loading={commentsLoading}
              emptyMessage="등록된 코멘트가 없습니다. 아래에서 코멘트를 남겨 주세요."
            />
          </div>
        </div>
        <OrderCommentForm
          onSubmit={handlePostComment}
          placeholder="고객에게 전달할 작업 코멘트를 입력하세요…"
          submitLabel="코멘트 등록"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                불러오는 중…
              </div>
            ) : order ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-mono text-lg font-bold text-slate-900">
                    {order.orderNumber}
                  </h2>
                  <OrderStatusSelect
                    status={order.status}
                    onChange={handleStatusChange}
                  />
                  {order.design && (
                    <Link
                      href={buildAdminBuilderHref({
                        productSlug: order.productSlug,
                        orderId: order.id,
                      })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      빌더 열기
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {order.customerName} · {order.productName} ·{" "}
                  {formatDate(order.createdAt)}
                </p>
              </>
            ) : (
              <p className="text-sm text-red-600">{error ?? "주문 없음"}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {order && (
          <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 sm:px-6">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                    tab === t.key
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading && (
            <div className="flex flex-1 items-center justify-center py-24 text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              주문 상세 불러오는 중…
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && order && (
            <div className="grid min-h-0 flex-1 lg:grid-cols-5">
              <div className="shrink-0 border-b border-slate-100 lg:col-span-3 lg:border-b-0 lg:border-r">
                {payload ? (
                  <div className="h-[320px] sm:h-[360px] lg:h-full lg:min-h-[480px]">
                    <DesignPreviewPanel
                      key={order.id}
                      payload={payload}
                      mockupFaces={order.mockupFaces}
                      side={previewSide}
                      onSideChange={setPreviewSide}
                      annotations={annotations}
                      highlightAnnotationId={activeAnnotationId}
                    />
                  </div>
                ) : (
                  <div className="flex h-[320px] flex-col items-center justify-center bg-slate-50 text-center sm:h-[360px] lg:min-h-[480px]">
                    <ImageIcon className="h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      저장된 작업물이 없습니다
                    </p>
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-col lg:col-span-2">
                <div className="flex-1 overflow-y-auto p-5">
                  {renderRightPanel()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ORDER_SUB_TABS: { key: OrderSubTabKey; label: string }[] = [
  { key: "customer", label: "고객정보" },
  { key: "payment", label: "주문 내용" },
  { key: "product", label: "상품옵션" },
];

function OrderDetailSubPanel({
  order,
  payload,
  subTab,
  onSubTabChange,
}: {
  order: OrderDetail;
  payload: SavedBuilderPayload | undefined;
  subTab: OrderSubTabKey;
  onSubTabChange: (tab: OrderSubTabKey) => void;
}) {
  return (
    <div className="-m-5 flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-4">
        {ORDER_SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onSubTabChange(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              subTab === t.key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {subTab === "customer" && (
          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">고객 정보</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <DetailRow label="회원명" value={order.customerName} />
              <DetailRow label="이메일" value={order.customerEmail} />
              <DetailRow
                label="주문일"
                value={formatDate(order.createdAt)}
              />
            </dl>

            <h3 className="mt-5 text-sm font-semibold text-slate-900">요청사항</h3>
            {order.notes ? (
              <div className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3">
                <p className="text-xs font-semibold text-amber-900">메모</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-amber-950/80">
                  {order.notes}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400">등록된 메모가 없습니다.</p>
            )}
          </section>
        )}

        {subTab === "payment" && (
          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">주문 내용</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <DetailRow label="주문번호" value={order.orderNumber} mono />
              <DetailRow label="수량" value={`${order.quantity}개`} />
              {order.items[0] && (
                <DetailRow
                  label="상품명"
                  value={order.items[0].productName}
                />
              )}
            </dl>
          </section>
        )}

        {subTab === "product" && (
          <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">상품 옵션</h3>
            {payload ? (
              <dl className="mt-3 space-y-2.5 text-sm">
                <DetailRow
                  label="제품"
                  value={PRODUCT_TYPE_LABELS[payload.options.productType]}
                />
                <DetailRow
                  label="사이즈"
                  value={SIZE_LABELS[payload.options.size]}
                />
                <DetailRow
                  label="원단"
                  value={FABRIC_LABELS[payload.options.fabric]}
                />
                <DetailRow
                  label="색상"
                  value={BAG_COLOR_LABELS[payload.options.bagColor]}
                />
                {payload.options.productType === "ecobag" && (
                  <>
                    <DetailRow
                      label="손잡이 끈 색상"
                      value={
                        BAG_COLOR_LABELS[payload.options.handleStrapColor]
                      }
                    />
                  </>
                )}
                <DetailRow
                  label="손잡이"
                  value={HANDLE_LABELS[payload.options.handle]}
                />
                <DetailRow
                  label="포켓"
                  value={POCKET_LABELS[payload.options.pocket]}
                />
                <DetailRow
                  label="인쇄면"
                  value={PRINT_SIDE_LABELS[payload.options.printSide]}
                />
                <DetailRow
                  label="수량"
                  value={`${payload.options.quantity}개`}
                />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                연결된 상품 옵션 데이터가 없습니다.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`text-right text-slate-900 ${mono ? "font-mono text-xs" : ""} ${bold ? "font-bold" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}
