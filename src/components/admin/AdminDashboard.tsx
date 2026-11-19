"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Box,
  ChevronRight,
  ClipboardList,
  Clock3,
  Factory,
  FolderTree,
  Package,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type {
  AdminDashboardData,
  QualityMetrics,
} from "@/lib/admin-dashboard";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { Order } from "@/types";

interface AdminDashboardProps {
  data: AdminDashboardData;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHeaderDate() {
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function todoReason(order: Order): string {
  if (order.status === "PENDING" || order.status === "AWAITING_PAYMENT") {
    return "접수 확인 필요";
  }
  if (order.status === "CONFIRMED" || order.status === "IN_PRODUCTION") {
    return "제작 진행";
  }
  return "처리 필요";
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const {
    summary,
    quality,
    statusBreakdown,
    dailyTrend,
    todoOrders,
    recentOrders,
    topProducts,
  } = data;

  const maxTrendOrders = useMemo(
    () => Math.max(...dailyTrend.map((d) => d.orders), 1),
    [dailyTrend],
  );

  const maxStatusCount = useMemo(
    () => Math.max(...statusBreakdown.map((s) => s.count), 1),
    [statusBreakdown],
  );

  const pipelineTotal = useMemo(
    () => statusBreakdown.reduce((sum, s) => sum + s.count, 0),
    [statusBreakdown],
  );

  const kpiCards = [
    {
      label: "오늘 접수",
      value: `${summary.todayOrders}건`,
      sub: "오늘 들어온 주문",
      icon: TrendingUp,
      href: "/admin/orders",
      tone: "emerald",
    },
    {
      label: "이번 주",
      value: `${summary.weekOrders}건`,
      sub: "이번 주 주문",
      icon: Banknote,
      href: "/admin/orders",
      tone: "blue",
    },
    {
      label: "신규 접수",
      value: `${summary.unpaidCount}건`,
      sub: "확인이 필요한 주문",
      icon: AlertCircle,
      href: "/admin/orders",
      tone: "amber",
    },
    {
      label: "처리할 일",
      value: `${data.summary.todoCount}건`,
      sub: "접수·제작",
      icon: ClipboardList,
      href: "/admin/orders",
      tone: "rose",
    },
    {
      label: "판매 상품",
      value: `${summary.activeProducts}개`,
      sub: `전체 ${summary.totalProducts}개`,
      icon: ShoppingBag,
      href: "/admin/products",
      tone: "slate",
    },
  ];

  const toneStyles = {
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      ring: "ring-emerald-100",
    },
    blue: { icon: "bg-blue-50 text-blue-600", ring: "ring-blue-100" },
    amber: { icon: "bg-amber-50 text-amber-600", ring: "ring-amber-100" },
    rose: { icon: "bg-rose-50 text-rose-600", ring: "ring-rose-100" },
    slate: { icon: "bg-slate-100 text-slate-600", ring: "ring-slate-100" },
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{formatHeaderDate()}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            운영 대시보드
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            주문·제작·상품 현황을 한 화면에서 확인하고 바로 처리하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickLink href="/admin/orders" icon={ClipboardList} label="주문 관리" />
          <QuickLink href="/admin/products" icon={ShoppingBag} label="상품 관리" />
          <QuickLink href="/" icon={ArrowUpRight} label="스토어 보기" external />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const tone = toneStyles[card.tone as keyof typeof toneStyles];
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:border-slate-300 hover:shadow-md ${tone.ring}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
                </div>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-slate-600">
                자세히 보기
                <ArrowRight className="h-3 w-3" />
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ReworkRateCard quality={quality} />
        <ComplianceRateCard quality={quality} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">최근 7일 접수</h2>
              <p className="text-xs text-slate-400">일별 접수 건수</p>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              전체 {summary.totalOrders}건
            </p>
          </div>
          <div className="flex h-40 items-end gap-2 sm:gap-3">
            {dailyTrend.map((day) => {
              const height = Math.max(8, (day.orders / maxTrendOrders) * 100);
              return (
                <div
                  key={day.date}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex w-full flex-1 flex-col justify-end">
                    <div
                      className="mx-auto w-full max-w-[48px] rounded-t-lg bg-slate-900 transition-all"
                      style={{ height: `${height}%` }}
                      title={`${day.label}: ${day.orders}건`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-medium text-slate-500">
                      {day.label.split("(")[0]?.trim()}
                    </p>
                    <p className="text-[10px] tabular-nums text-slate-400">
                      {day.orders}건
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">운영 스냅샷</h2>
          <div className="mt-4 space-y-3">
            <SnapshotRow
              icon={Factory}
              label="제작 중"
              value={`${summary.inProductionCount}건`}
              href="/admin/orders"
            />
            <SnapshotRow
              icon={Truck}
              label="작업 완료"
              value={`${summary.shippedCount}건`}
              href="/admin/orders"
            />
            <SnapshotRow
              icon={Users}
              label="가입 고객"
              value={`${summary.totalCustomers}명`}
              href="/admin/users"
            />
            <SnapshotRow
              icon={FolderTree}
              label="카테고리"
              value={`${summary.totalCategories}개`}
              href="/admin/categories"
            />
            <SnapshotRow
              icon={Package}
              label="누적 주문"
              value={`${summary.totalOrders}건`}
              href="/admin/orders"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm xl:col-span-1">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">처리할 일</h2>
                <p className="text-xs text-slate-400">우선 처리가 필요한 주문</p>
              </div>
              {todoOrders.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {todoOrders.length}
                </span>
              )}
            </div>
          </div>
          {todoOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">처리 대기 주문이 없습니다</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {todoOrders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="group flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50/80"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
                      !
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          {todoReason(order)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-600">
                        {order.customerName} · {order.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 px-5 py-3">
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              주문 목록에서 전체 처리 →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm xl:col-span-2">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
              <h2 className="text-sm font-semibold text-slate-900">주문 상태</h2>
              <p className="mb-4 text-xs text-slate-400">전체 {pipelineTotal}건</p>
              <div className="space-y-2.5">
                {statusBreakdown
                  .filter((s) => s.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((s) => (
                    <div key={s.status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          {ORDER_STATUS_LABELS[s.status]}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {s.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-800"
                          style={{
                            width: `${(s.count / maxStatusCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="p-5">
              <h2 className="text-sm font-semibold text-slate-900">인기 상품</h2>
              {topProducts.length > 0 ? (
                <>
                  <p className="mb-4 text-xs text-slate-400">주문 많은 상품</p>
                  <ul className="mt-3 space-y-2">
                    {topProducts.slice(0, 4).map((p, i) => (
                      <li key={p.productId}>
                        <Link
                          href={p.slug ? `/products/${p.slug}` : "/admin/products"}
                          className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-slate-50"
                          target={p.slug ? "_blank" : undefined}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-500">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-slate-700">
                            {p.productName}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-slate-400">
                            {p.orderCount}건
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-400">아직 주문이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">최근 주문</h2>
            <p className="text-xs text-slate-400">방금 접수된 주문</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            전체 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Box className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              아직 접수된 주문이 없습니다
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
                    <th className="px-5 py-3 sm:px-6">주문번호</th>
                    <th className="px-3 py-3">고객</th>
                    <th className="px-3 py-3">상품</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">접수일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="cursor-pointer hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold text-slate-900 sm:px-6">
                        {order.orderNumber}
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm text-slate-800">
                          {order.customerName}
                        </p>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-slate-600">
                        {order.productName}
                        <span className="ml-1 text-slate-400">×{order.quantity}</span>
                      </td>
                      <td className="px-3 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-50 md:hidden">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-slate-50/80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-slate-900">
                        {order.orderNumber}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-600">
                        {order.customerName} · {order.productName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-slate-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 text-slate-500" />
      {label}
    </Link>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </span>
    </Link>
  );
}

function ReworkRateCard({ quality }: { quality: QualityMetrics }) {
  const maxBar = Math.max(
    ...quality.reworkMonthly.map((m) => Math.max(m.workCount, m.commentCount)),
    1,
  );
  const yMax = Math.max(1, Math.ceil(maxBar));
  const yTicks = Array.from(
    new Set([yMax, Math.round(yMax * 0.5), 0].map((v) => Math.max(0, v))),
  ).sort((a, b) => b - a);
  const goalMet = quality.reworkRatePercent <= quality.reworkGoalPercent;

  /** 막대 위 레이블 여백을 위해 최대 높이 85% */
  const countToHeightPct = (count: number) =>
    count <= 0 ? 0 : Math.max(10, (count / yMax) * 85);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">재작업률</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {quality.reworkRatePercent}
            <span className="ml-0.5 text-lg font-semibold text-slate-500">%</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {quality.reworkOrderCount}건 / {quality.totalWorkOrderCount}건
            (고객 코멘트)
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <RefreshCcw className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-500">최근 6개월</p>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              작업건수
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              고객 코멘트
            </span>
          </div>
        </div>

        <div className="flex gap-1.5">
          <div className="relative h-40 w-7 shrink-0" aria-hidden>
            {yTicks.map((tick) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums leading-none text-slate-400"
                style={{
                  top: `${100 - (tick / yMax) * 85}%`,
                }}
              >
                {tick}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-40 w-full">
              <div className="pointer-events-none absolute inset-0">
                {yTicks.map((tick) => (
                  <div
                    key={tick}
                    className="absolute inset-x-0 border-t border-slate-100"
                    style={{
                      top: `${100 - (tick / yMax) * 85}%`,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-[1] flex h-full items-end gap-2">
                {quality.reworkMonthly.map((m) => {
                  const workH = countToHeightPct(m.workCount);
                  const commentH = countToHeightPct(m.commentCount);
                  return (
                    <div
                      key={m.key}
                      className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5"
                    >
                      <div className="relative h-full w-[42%] max-w-[16px]">
                        {m.workCount > 0 ? (
                          <span
                            className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums leading-none text-slate-600"
                            style={{ bottom: `calc(${workH}% + 4px)` }}
                          >
                            {m.workCount}
                          </span>
                        ) : null}
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-t bg-slate-300"
                          style={{ height: `${workH}%` }}
                          title={`작업 ${m.workCount}건`}
                        />
                      </div>
                      <div className="relative h-full w-[42%] max-w-[16px]">
                        {m.commentCount > 0 ? (
                          <span
                            className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums leading-none text-amber-700"
                            style={{ bottom: `calc(${commentH}% + 4px)` }}
                          >
                            {m.commentCount}
                          </span>
                        ) : null}
                        {m.commentCount > 0 ? (
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t bg-amber-400"
                            style={{ height: `${commentH}%` }}
                            title={`코멘트 ${m.commentCount}건`}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-1 flex w-full">
              {quality.reworkMonthly.map((m) => (
                <span
                  key={m.key}
                  className="min-w-0 flex-1 text-center text-[10px] text-slate-400"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>구축 목표 {quality.reworkGoalPercent}% 이하</span>
        {goalMet ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            목표 달성
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            개선 필요
          </span>
        )}
      </div>
    </div>
  );
}

function ComplianceRateCard({ quality }: { quality: QualityMetrics }) {
  const points = quality.complianceMonthly;
  const goal = quality.complianceGoalPercent;
  const goalMet =
    quality.deliveryCompliancePercent != null &&
    quality.deliveryCompliancePercent >= goal;
  const n = points.length;
  const hasShipData = quality.shippedSampleCount > 0;
  const yTicks = [100, 75, 50, 25, 0] as const;

  /** 값(%) → 플롯 영역 top% (0=상단, 100=하단). 레이블 여백 확보 */
  const valueToTop = (value: number) => {
    const topPad = 10;
    const bottomPad = 4;
    const usable = 100 - topPad - bottomPad;
    return topPad + ((100 - Math.max(0, Math.min(100, value))) / 100) * usable;
  };

  const coords = points.map((p, i) => {
    const x = n <= 1 ? 50 : ((i + 0.5) / n) * 100;
    const value = p.compliancePercent;
    const y = value == null ? null : valueToTop(value);
    return { x, y, value, label: p.label, key: p.key };
  });

  const linePath = coords
    .filter((c) => c.y != null)
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y!.toFixed(2)}`)
    .join(" ");

  const goalY = valueToTop(goal);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">납기 준수율</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {quality.deliveryCompliancePercent == null ? (
              "—"
            ) : (
              <>
                {quality.deliveryCompliancePercent}
                <span className="ml-0.5 text-lg font-semibold text-slate-500">
                  %
                </span>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {hasShipData
              ? `납기 내 ${quality.onTimeShipCount}건 / 출하 ${quality.shippedSampleCount}건`
              : "배송중으로 변경된 주문이 없습니다"}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Clock3 className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-500">
            월별 납기 준수율(%)
          </p>
          <span className="text-[10px] text-slate-400">
            점선 {goal}% 목표
          </span>
        </div>

        <div className="flex gap-1.5">
          <div className="relative h-40 w-7 shrink-0" aria-hidden>
            {yTicks.map((tick) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums leading-none text-slate-400"
                style={{ top: `${valueToTop(tick)}%` }}
              >
                {tick}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-40 w-full">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
                role="img"
                aria-label="월별 납기 준수율 추이"
              >
                {yTicks.map((tick) => (
                  <line
                    key={tick}
                    x1="0"
                    y1={valueToTop(tick)}
                    x2="100"
                    y2={valueToTop(tick)}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <line
                  x1="0"
                  y1={goalY}
                  x2="100"
                  y2={goalY}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  vectorEffect="non-scaling-stroke"
                />
                {hasShipData && linePath ? (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : (
                  <line
                    x1="0"
                    y1={valueToTop(0)}
                    x2="100"
                    y2={valueToTop(0)}
                    stroke="#93c5fd"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>

              <div className="pointer-events-none absolute inset-0 flex">
                {coords.map((c) => (
                  <div
                    key={c.key}
                    className="relative h-full min-w-0 flex-1"
                  >
                    {c.y != null && c.value != null && c.value !== 0 ? (
                      <span
                        className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums text-blue-700"
                        style={{
                          top: `calc(${c.y}% - 14px)`,
                        }}
                      >
                        {c.value}%
                      </span>
                    ) : null}
                    {c.y != null ? (
                      <span
                        className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 ring-2 ring-white"
                        style={{ top: `${c.y}%` }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-1 flex w-full">
              {points.map((p) => (
                <span
                  key={p.key}
                  className="min-w-0 flex-1 text-center text-[10px] text-slate-400"
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>구축 목표 {goal}% 이상 · 납기 기준 주문+7일</span>
        {quality.deliveryCompliancePercent == null ? null : goalMet ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            목표 달성
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            개선 필요
          </span>
        )}
      </div>
    </div>
  );
}
