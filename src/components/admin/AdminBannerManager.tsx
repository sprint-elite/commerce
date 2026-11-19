"use client";

import { useMemo, useState } from "react";
import {
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AdminImageUploadField } from "@/components/admin/AdminImageUploadField";

type BannerRow = {
  id: string;
  placement: string;
  tag: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
};

const PLACEMENTS = [
  { value: "HOME_HERO", label: "히어로" },
  { value: "HOME_PROMO", label: "프로모" },
  { value: "HOME_IDEA", label: "아이디어" },
  { value: "HOME_GUIDE", label: "가이드" },
] as const;

type PlacementFilter = "ALL" | (typeof PLACEMENTS)[number]["value"];
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const empty = (): Omit<BannerRow, "id"> => ({
  placement: "HOME_HERO",
  tag: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "/",
  sortOrder: 0,
  isActive: true,
});

function placementLabel(value: string) {
  return PLACEMENTS.find((p) => p.value === value)?.label ?? value;
}

export function AdminBannerManager({
  initialBanners,
}: {
  initialBanners: BannerRow[];
}) {
  const [rows, setRows] = useState(initialBanners);
  const [form, setForm] = useState(empty());
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [placementFilter, setPlacementFilter] =
    useState<PlacementFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const placementCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rows.length };
    for (const p of PLACEMENTS) counts[p.value] = 0;
    for (const r of rows) counts[r.placement] = (counts[r.placement] ?? 0) + 1;
    return counts;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) =>
        placementFilter === "ALL" ? true : r.placement === placementFilter,
      )
      .filter((r) => {
        if (statusFilter === "ACTIVE") return r.isActive;
        if (statusFilter === "INACTIVE") return !r.isActive;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          (r.subtitle?.toLowerCase().includes(q) ?? false) ||
          (r.tag?.toLowerCase().includes(q) ?? false) ||
          r.linkUrl.toLowerCase().includes(q) ||
          (r.imageUrl?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }, [rows, query, placementFilter, statusFilter]);

  const detail = detailId ? rows.find((r) => r.id === detailId) ?? null : null;

  const openCreate = () => {
    setEditId(null);
    setForm(empty());
    setError(null);
    setOpen(true);
  };

  const openEdit = (b: BannerRow) => {
    setEditId(b.id);
    setForm({
      placement: b.placement,
      tag: b.tag ?? "",
      title: b.title,
      subtitle: b.subtitle ?? "",
      imageUrl: b.imageUrl ?? "",
      linkUrl: b.linkUrl,
      sortOrder: b.sortOrder,
      isActive: b.isActive,
    });
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        editId ? `/api/admin/banners/${editId}` : "/api/admin/banners",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            tag: form.tag || null,
            subtitle: form.subtitle || null,
            imageUrl: form.imageUrl || null,
          }),
        },
      );
      const data = (await res.json()) as { banner?: BannerRow; error?: string };
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      if (data.banner) {
        setRows((prev) => {
          if (editId) {
            return prev.map((r) => (r.id === editId ? data.banner! : r));
          }
          return [...prev, data.banner!];
        });
        setDetailId(data.banner.id);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (detailId === id) setDetailId(null);
    }
  };

  const toggleActive = async (b: BannerRow) => {
    const res = await fetch(`/api/admin/banners/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placement: b.placement,
        tag: b.tag,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
        sortOrder: b.sortOrder,
        isActive: !b.isActive,
      }),
    });
    const data = (await res.json()) as { banner?: BannerRow };
    if (res.ok && data.banner) {
      setRows((prev) => prev.map((r) => (r.id === b.id ? data.banner! : r)));
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            배너 · 홈 콘텐츠
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            히어로 / 프로모 / 아이디어 / 가이드 배너를 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> 배너 추가
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              표시{" "}
              <span className="font-semibold text-slate-900">
                {filtered.length}
              </span>
              / {rows.length}건
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="제목, 부제, 태그, 링크"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="ALL">상태 전체</option>
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
            <FilterChip
              active={placementFilter === "ALL"}
              label="전체"
              count={placementCounts.ALL}
              onClick={() => setPlacementFilter("ALL")}
            />
            {PLACEMENTS.map((p) => (
              <FilterChip
                key={p.value}
                active={placementFilter === p.value}
                label={p.label}
                count={placementCounts[p.value] ?? 0}
                onClick={() => setPlacementFilter(p.value)}
              />
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <ImageIcon className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              {rows.length === 0
                ? "등록된 배너가 없습니다"
                : "검색 결과가 없습니다"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
                    <th className="px-4 py-3">배너</th>
                    <th className="px-3 py-3">위치</th>
                    <th className="px-3 py-3">링크</th>
                    <th className="px-3 py-3">정렬</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setDetailId(b.id)}
                      className="group cursor-pointer hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <BannerThumb url={b.imageUrl} title={b.title} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {b.title}
                            </p>
                            {b.subtitle ? (
                              <p className="mt-0.5 max-w-[280px] truncate text-xs text-slate-500">
                                {b.subtitle}
                              </p>
                            ) : null}
                            {b.tag ? (
                              <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                {b.tag}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                          {placementLabel(b.placement)}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 font-mono text-xs text-slate-500">
                        {b.linkUrl}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {b.sortOrder}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge active={b.isActive} />
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEdit(b)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(b.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {filtered.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setDetailId(b.id)}
                  className="flex w-full gap-3 px-4 py-4 text-left hover:bg-slate-50/80"
                >
                  <BannerThumb url={b.imageUrl} title={b.title} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-slate-900">
                        {b.title}
                      </p>
                      <StatusBadge active={b.isActive} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {placementLabel(b.placement)} · 정렬 {b.sortOrder}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                      {b.linkUrl}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {detail && (
        <DetailModal
          title="배너 상세"
          onClose={() => setDetailId(null)}
          actions={
            <>
              <button
                type="button"
                onClick={() => void toggleActive(detail)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                {detail.isActive ? "비활성" : "활성"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailId(null);
                  openEdit(detail);
                }}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => void remove(detail.id)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
              >
                삭제
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {detail.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detail.imageUrl}
                alt={detail.title}
                className="max-h-48 w-full rounded-xl object-cover bg-slate-100"
              />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <dl className="space-y-2.5 text-sm">
              <DetailRow label="제목" value={detail.title} />
              <DetailRow label="부제" value={detail.subtitle ?? "—"} />
              <DetailRow label="태그" value={detail.tag ?? "—"} />
              <DetailRow
                label="위치"
                value={placementLabel(detail.placement)}
              />
              <DetailRow label="링크" value={detail.linkUrl} mono />
              <DetailRow label="정렬" value={String(detail.sortOrder)} />
              <DetailRow
                label="상태"
                value={detail.isActive ? "활성" : "비활성"}
              />
            </dl>
          </div>
        </DetailModal>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {editId ? "배너 수정" : "배너 추가"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <select
                value={form.placement}
                onChange={(e) =>
                  setForm((f) => ({ ...f, placement: e.target.value }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <AdminImageUploadField
                label="배너 이미지"
                variant="dropzone"
                value={form.imageUrl ?? ""}
                onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
              />
              {(
                [
                  ["title", "제목"],
                  ["subtitle", "부제"],
                  ["tag", "태그/이모지"],
                  ["linkUrl", "링크"],
                  ["sortOrder", "정렬"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm">
                  <span className="mb-1 block text-xs text-slate-500">
                    {label}
                  </span>
                  <input
                    value={String(form[key] ?? "")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        [key]:
                          key === "sortOrder"
                            ? Number(e.target.value) || 0
                            : e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                활성
              </label>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 tabular-nums ${active ? "text-slate-300" : "text-slate-400"}`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "활성" : "비활성"}
    </span>
  );
}

function BannerThumb({
  url,
  title,
}: {
  url: string | null;
  title: string;
}) {
  if (!url) {
    return (
      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={title}
      className="h-12 w-16 shrink-0 rounded-lg object-cover bg-slate-100"
    />
  );
}

function DetailModal({
  title,
  onClose,
  actions,
  children,
}: {
  title: string;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {actions ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-xs font-medium text-slate-400">
        {label}
      </dt>
      <dd
        className={`min-w-0 flex-1 break-all text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
