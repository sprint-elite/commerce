"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageOpen } from "lucide-react";
import {
  AdminEmptyState,
  AdminFilterDivider,
  AdminFilterPill,
  AdminListCard,
  AdminListToolbar,
  AdminPageShell,
  adminTableHeadClass,
  adminTableRowClass,
  formatAdminDate,
} from "@/components/admin/AdminListUi";

type Row = {
  id: string;
  type: string;
  reason: string;
  status: string;
  adminNote: string | null;
  orderNumber: string;
  productName: string;
  userName: string;
  userEmail: string;
  createdAt: string;
};

const STATUS_OPTS = [
  { value: "PENDING", label: "접수" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "거절" },
  { value: "DONE", label: "완료" },
] as const;

function statusLabel(status: string) {
  return STATUS_OPTS.find((s) => s.value === status)?.label ?? status;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "PENDING"
      ? "bg-amber-50 text-amber-700"
      : status === "APPROVED"
        ? "bg-sky-50 text-sky-700"
        : status === "DONE"
          ? "bg-emerald-50 text-emerald-700"
          : status === "REJECTED"
            ? "bg-rose-50 text-rose-700"
            : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {statusLabel(status)}
    </span>
  );
}

export function AdminReturnManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "RETURN" | "EXCHANGE">(
    "ALL",
  );

  const load = async () => {
    const res = await fetch("/api/admin/returns");
    const data = (await res.json()) as { returns?: Row[] };
    setRows(data.returns ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (status === "ALL" ? true : r.status === status))
      .filter((r) => (typeFilter === "ALL" ? true : r.type === typeFilter))
      .filter(
        (r) =>
          !q ||
          r.orderNumber.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q),
      );
  }, [rows, query, status, typeFilter]);

  const patch = async (id: string, nextStatus: string, type: string) => {
    if (
      type === "RETURN" &&
      nextStatus === "DONE" &&
      !window.confirm(
        "반품 완료 시 재고 복구와 주문 취소가 함께 처리됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await load();
  };

  return (
    <AdminPageShell
      title="교환 · 반품"
      description="반품을 완료로 바꾸면 재고 복구와 주문 취소가 함께 처리됩니다. (교환은 상태만 변경)"
    >
      <AdminListCard>
        <AdminListToolbar
          countText={
            <>
              표시 <span className="font-semibold text-slate-800">{filtered.length}</span> /{" "}
              {rows.length}건
            </>
          }
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "주문번호, 고객, 상품, 사유",
          }}
          pills={
            <>
              {(
                [
                  ["ALL", "상태 전체"],
                  ...STATUS_OPTS.map((s) => [s.value, s.label] as const),
                ] as const
              ).map(([key, label]) => (
                <AdminFilterPill
                  key={key}
                  active={status === key}
                  onClick={() => setStatus(key)}
                >
                  {label}
                </AdminFilterPill>
              ))}
              <AdminFilterDivider />
              {(
                [
                  ["ALL", "구분 전체"],
                  ["RETURN", "반품"],
                  ["EXCHANGE", "교환"],
                ] as const
              ).map(([key, label]) => (
                <AdminFilterPill
                  key={key}
                  active={typeFilter === key}
                  onClick={() => setTypeFilter(key)}
                >
                  {label}
                </AdminFilterPill>
              ))}
            </>
          }
        />

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={<PackageOpen className="h-12 w-12" />}
            title={rows.length === 0 ? "접수된 건이 없습니다" : "검색 결과가 없습니다"}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className={adminTableHeadClass()}>
                    <th className="px-4 py-3">구분 · 주문</th>
                    <th className="px-3 py-3">고객</th>
                    <th className="px-3 py-3">상품</th>
                    <th className="px-3 py-3">사유</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">접수일</th>
                    <th className="px-3 py-3 text-right">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => (
                    <tr key={r.id} className={adminTableRowClass()}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {r.type === "EXCHANGE" ? "교환" : "반품"}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {r.orderNumber}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-slate-800">{r.userName}</p>
                        <p className="text-xs text-slate-500">{r.userEmail}</p>
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-3 text-slate-600">
                        {r.productName}
                      </td>
                      <td className="max-w-[220px] px-3 py-3 text-slate-600">
                        <p className="line-clamp-2 text-sm">{r.reason}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                        {formatAdminDate(r.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-end gap-1">
                          {STATUS_OPTS.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => void patch(r.id, s.value, r.type)}
                              className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                                r.status === s.value
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-50 xl:hidden">
              {filtered.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {r.type === "EXCHANGE" ? "교환" : "반품"} · {r.orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {r.userName} · {r.productName}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">{r.reason}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatAdminDate(r.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {STATUS_OPTS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => void patch(r.id, s.value, r.type)}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                          r.status === s.value
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminListCard>
    </AdminPageShell>
  );
}
