"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { AdminCategoryDto, AdminProductDto } from "@/lib/admin-catalog";
import { BUILDER_TYPES, slugify } from "@/lib/builder-types";
import {
  PRODUCT_SALE_TYPES,
  type ProductSaleType,
} from "@/lib/product-sale-type";
import type { ProductType } from "@/types/builder";
import {
  AdminProductMockupEditor,
  type AdminProductMockupEditorHandle,
} from "./AdminProductMockupEditor";
import { AdminImageUploadField } from "./AdminImageUploadField";

interface AdminProductManagerProps {
  initialProducts: AdminProductDto[];
  categories: AdminCategoryDto[];
}

type FormState = {
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  basePrice: string;
  minQuantity: string;
  maxQuantity: string;
  thumbnailUrl: string;
  saleType: ProductSaleType;
  builderType: ProductType;
  categoryId: string;
  sortOrder: string;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
};

type SaleFilter = "ALL" | ProductSaleType;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortKey = "sortOrder" | "name" | "updated";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function patchProduct(
  id: string,
  body: {
    isActive?: boolean;
    isFeatured?: boolean;
    isNew?: boolean;
    sortOrder?: number;
  },
): Promise<AdminProductDto[]> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    products?: AdminProductDto[];
    error?: string;
  };
  if (!res.ok || !data.products) {
    throw new Error(data.error ?? "저장 실패");
  }
  return data.products;
}

function emptyForm(categories: AdminCategoryDto[]): FormState {
  return {
    name: "",
    slug: "",
    shortDesc: "",
    description: "",
    basePrice: "3500",
    minQuantity: "1",
    maxQuantity: "9999",
    thumbnailUrl: "",
    saleType: "CUSTOM",
    builderType: "ecobag",
    categoryId: categories[0]?.id ?? "",
    sortOrder: "0",
    isActive: true,
    isFeatured: false,
    isNew: false,
  };
}

export function AdminProductManager({
  initialProducts,
  categories,
}: AdminProductManagerProps) {
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(categories));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saleFilter, setSaleFilter] = useState<SaleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("sortOrder");
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);
  const mockupRef = useRef<AdminProductMockupEditorHandle | null>(null);

  const title = editingId ? "상품 수정" : "상품 추가";

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive).length;
    const custom = products.filter((p) => p.saleType === "CUSTOM").length;
    return {
      total: products.length,
      active,
      inactive: products.length - active,
      custom,
      readymade: products.length - custom,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (saleFilter !== "ALL" && p.saleType !== saleFilter) return false;
      if (statusFilter === "ACTIVE" && !p.isActive) return false;
      if (statusFilter === "INACTIVE" && p.isActive) return false;
      if (categoryFilter !== "ALL" && p.categoryId !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.categoryName?.toLowerCase().includes(q) ?? false) ||
        (p.shortDesc?.toLowerCase().includes(q) ?? false)
      );
    });

    return list.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "updated") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    });
  }, [products, query, saleFilter, statusFilter, categoryFilter, sortKey]);

  const toggleField = async (
    p: AdminProductDto,
    field: "isActive" | "isFeatured" | "isNew",
  ) => {
    setToggleBusyId(p.id);
    setError(null);
    try {
      const next = await patchProduct(p.id, { [field]: !p[field] });
      setProducts(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "변경 실패");
    } finally {
      setToggleBusyId(null);
    }
  };

  const duplicateProduct = async (p: AdminProductDto) => {
    const name = `${p.name} (복사)`;
    if (!confirm(`"${name}" 상품을 복사할까요?\n목업·옵션은 포함되지 않습니다.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: `${p.slug}-copy-${Date.now().toString(36).slice(-4)}`,
          shortDesc: p.shortDesc ?? "",
          description: p.description ?? "",
          basePrice: p.basePrice,
          minQuantity: p.minQuantity,
          maxQuantity: p.maxQuantity,
          thumbnailUrl: p.thumbnailUrl ?? "",
          saleType: p.saleType,
          builderType: p.builderType,
          categoryId: p.categoryId,
          sortOrder: p.sortOrder + 1,
          isActive: false,
          isFeatured: false,
          isNew: false,
        }),
      });
      const data = (await res.json()) as {
        products?: AdminProductDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "복사 실패");
      setProducts(data.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "복사 실패");
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(categories));
    setError(null);
    setOpen(true);
  };

  const openEdit = (p: AdminProductDto) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      shortDesc: p.shortDesc ?? "",
      description: p.description ?? "",
      basePrice: String(p.basePrice),
      minQuantity: String(p.minQuantity),
      maxQuantity: String(p.maxQuantity),
      thumbnailUrl: p.thumbnailUrl ?? "",
      saleType: p.saleType,
      builderType: p.builderType,
      categoryId: p.categoryId ?? "",
      sortOrder: String(p.sortOrder),
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isNew: p.isNew,
    });
    setError(null);
    setOpen(true);
  };

  const payloadFromForm = () => ({
    name: form.name.trim(),
    slug: form.slug.trim() || slugify(form.name),
    shortDesc: form.shortDesc.trim(),
    description: form.description.trim(),
    basePrice: Number(form.basePrice),
    minQuantity: Number(form.minQuantity),
    maxQuantity: Number(form.maxQuantity),
    thumbnailUrl: form.thumbnailUrl.trim(),
    saleType: form.saleType,
    builderType: form.builderType,
    categoryId: form.categoryId || null,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    isNew: form.isNew,
  });

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (editingId && form.saleType === "CUSTOM") {
        await mockupRef.current?.save();
      }
      const res = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadFromForm()),
        },
      );
      const data = (await res.json()) as {
        products?: AdminProductDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setProducts(data.products ?? []);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: AdminProductDto) => {
    if (
      !confirm(
        `"${p.name}"을(를) 삭제할까요?\n주문/디자인이 있으면 비활성화됩니다.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        products?: AdminProductDto[];
        error?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      setProducts(data.products ?? []);
      if (data.message) alert(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            상품 관리
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            판매 상태·노출 뱃지를 목록에서 바로 바꾸고, 상세 편집에서 목업을
            설정합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/categories"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            카테고리 관리
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            상품 추가
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="전체" value={stats.total} />
        <StatCard label="판매중" value={stats.active} accent="emerald" />
        <StatCard label="비활성" value={stats.inactive} accent="slate" />
        <StatCard label="커스텀" value={stats.custom} accent="teal" />
        <StatCard label="기성품" value={stats.readymade} accent="indigo" />
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              표시{" "}
              <span className="font-semibold text-slate-900">
                {filtered.length}
              </span>
              / {products.length}건
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="상품명, 슬러그, 카테고리, 설명"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="ALL">카테고리 전체</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="sortOrder">정렬순</option>
                <option value="name">이름순</option>
                <option value="updated">수정일</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                { key: "ALL" as StatusFilter, label: "상태 전체" },
                { key: "ACTIVE" as StatusFilter, label: "판매중" },
                { key: "INACTIVE" as StatusFilter, label: "비활성" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusFilter === f.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-slate-200" />
            {(
              [
                { value: "ALL" as SaleFilter, label: "구분 전체" },
                ...PRODUCT_SALE_TYPES.map((t) => ({
                  value: t.value as SaleFilter,
                  label: t.shortLabel,
                })),
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSaleFilter(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  saleFilter === opt.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && !open && (
          <p className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <Package className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              {products.length === 0
                ? "등록된 상품이 없습니다"
                : "검색 결과가 없습니다"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
                    <th className="px-4 py-3">상품</th>
                    <th className="px-3 py-3">구분</th>
                    <th className="px-3 py-3">카테고리</th>
                    <th className="px-3 py-3">수량</th>
                    <th className="px-3 py-3">재고</th>
                    <th className="px-3 py-3">정렬</th>
                    <th className="px-3 py-3">주문 · 평점</th>
                    <th className="px-3 py-3">노출</th>
                    <th className="px-3 py-3">수정일</th>
                    <th className="px-3 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p) => {
                    const rowBusy = toggleBusyId === p.id || busy;
                    return (
                      <tr key={p.id} className="group hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb
                              url={p.thumbnailUrl}
                              name={p.name}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {p.name}
                              </p>
                              <p className="font-mono text-[11px] text-slate-400">
                                {p.slug}
                              </p>
                              {p.shortDesc ? (
                                <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">
                                  {p.shortDesc}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <SaleTypeBadge saleType={p.saleType} />
                          {p.saleType === "CUSTOM" ? (
                            <p className="mt-1 text-[11px] text-slate-500">
                              {BUILDER_TYPES.find((t) => t.value === p.builderType)
                                ?.label ?? p.builderType}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {p.categoryName ?? "—"}
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm text-slate-700">
                            {p.minQuantity}~{p.maxQuantity}개
                          </p>
                        </td>
                        <td className="px-3 py-3 text-sm tabular-nums text-slate-600">
                          {p.saleType === "READYMADE" ? (
                            p.stockQuantity == null ? (
                              <span className="text-slate-400">무제한</span>
                            ) : p.stockQuantity <= 0 ? (
                              <span className="font-semibold text-rose-600">
                                품절
                              </span>
                            ) : (
                              `${p.stockQuantity.toLocaleString()}개`
                            )
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-slate-600">
                          {p.sortOrder}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-0.5 text-[11px] text-slate-500">
                            <span>주문 {p.orderCount}</span>
                            <span className="text-slate-600">
                              {p.reviewCount > 0
                                ? `★ ${p.ratingAvg.toFixed(1)} (${p.reviewCount})`
                                : "★ —"}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-wrap gap-1">
                            <ToggleChip
                              label="판매"
                              active={p.isActive}
                              disabled={rowBusy}
                              onClick={() => void toggleField(p, "isActive")}
                            />
                            <ToggleChip
                              label="BEST"
                              active={p.isFeatured}
                              disabled={rowBusy}
                              variant="indigo"
                              onClick={() => void toggleField(p, "isFeatured")}
                            />
                            <ToggleChip
                              label="NEW"
                              active={p.isNew}
                              disabled={rowBusy}
                              variant="sky"
                              onClick={() => void toggleField(p, "isNew")}
                            />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                          {formatDate(p.updatedAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {rowBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <>
                                <Link
                                  href={`/admin/products/${p.id}`}
                                  className="inline-flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  title="기본 정보 · 상세 · 재고"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  편집
                                </Link>
                                <Link
                                  href={`/products/${p.slug}`}
                                  target="_blank"
                                  className="inline-flex items-center justify-center border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                  title="스토어에서 보기"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void duplicateProduct(p)}
                                  className="inline-flex items-center justify-center border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                                  title="복사"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void remove(p)}
                                  className="inline-flex items-center justify-center border border-slate-200 p-1.5 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                  title="삭제"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {filtered.map((p) => {
                const rowBusy = toggleBusyId === p.id || busy;
                return (
                  <div key={p.id} className="px-4 py-4">
                    <div className="flex gap-3">
                      <ProductThumb url={p.thumbnailUrl} name={p.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {p.name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-400">
                              {p.slug}
                            </p>
                          </div>
                          <SaleTypeBadge saleType={p.saleType} />
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {p.categoryName ?? "카테고리 없음"}
                        </p>
                        <p className="text-xs text-slate-400">
                          정렬 {p.sortOrder} · {formatDate(p.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div
                      className="mt-3 flex flex-wrap gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ToggleChip
                        label="판매"
                        active={p.isActive}
                        disabled={rowBusy}
                        onClick={() => void toggleField(p, "isActive")}
                      />
                      <ToggleChip
                        label="BEST"
                        active={p.isFeatured}
                        disabled={rowBusy}
                        variant="indigo"
                        onClick={() => void toggleField(p, "isFeatured")}
                      />
                      <ToggleChip
                        label="NEW"
                        active={p.isNew}
                        disabled={rowBusy}
                        variant="sky"
                        onClick={() => void toggleField(p, "isNew")}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        편집
                      </Link>
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void duplicateProduct(p)}
                        className="border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        복사
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(p)}
                        className="border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-5">
          <div className="flex h-[100dvh] w-full max-w-[1480px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(92vh,880px)] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  {title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {form.saleType === "CUSTOM"
                    ? "왼쪽 상품 정보 · 오른쪽 목업"
                    : "상품 정보를 입력한 뒤 저장하세요."}
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Check
                  label="판매중"
                  checked={form.isActive}
                  onChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
                />
                <Check
                  label="BEST"
                  checked={form.isFeatured}
                  onChange={(isFeatured) =>
                    setForm((f) => ({ ...f, isFeatured }))
                  }
                />
                <Check
                  label="NEW"
                  checked={form.isNew}
                  onChange={(isNew) => setForm((f) => ({ ...f, isNew }))}
                />
              </div>
            </div>

            <div
              className={`min-h-0 flex-1 ${
                form.saleType === "CUSTOM"
                  ? "grid lg:grid-cols-[minmax(540px,600px)_minmax(0,1fr)]"
                  : "overflow-y-auto"
              }`}
            >
              <div
                className={`min-h-0 space-y-6 overflow-y-auto px-6 py-5 ${
                  form.saleType !== "CUSTOM" ? "mx-auto w-full max-w-2xl" : ""
                }`}
              >
                <section className="space-y-3">
                  <SectionTitle>판매 구분</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {PRODUCT_SALE_TYPES.map((t) => (
                      <label
                        key={t.value}
                        className={`cursor-pointer rounded-xl border p-3.5 text-sm transition ${
                          form.saleType === t.value
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="saleType"
                          className="sr-only"
                          checked={form.saleType === t.value}
                          onChange={() =>
                            setForm((f) => ({ ...f, saleType: t.value }))
                          }
                        />
                        <span className="block font-semibold">{t.label}</span>
                        <span
                          className={`mt-1 block whitespace-nowrap text-[11px] ${
                            form.saleType === t.value
                              ? "text-slate-300"
                              : "text-slate-500"
                          }`}
                        >
                          {t.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <SectionTitle>기본 정보</SectionTitle>
                  <Field
                    label="상품명"
                    value={form.name}
                    onChange={(name) =>
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: editingId ? f.slug : slugify(name),
                      }))
                    }
                    placeholder="예: 사각 에코백"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm">
                      <span className="mb-1.5 block text-xs font-medium text-slate-500">
                        카테고리
                      </span>
                      <select
                        value={form.categoryId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, categoryId: e.target.value }))
                        }
                        className={inputClass}
                      >
                        <option value="">없음</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {form.saleType === "CUSTOM" ? (
                      <label className="block text-sm">
                        <span className="mb-1.5 block text-xs font-medium text-slate-500">
                          빌더 타입
                        </span>
                        <select
                          value={form.builderType}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              builderType: e.target.value as ProductType,
                            }))
                          }
                          className={inputClass}
                        >
                          {BUILDER_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <Field
                        label="정렬"
                        value={form.sortOrder}
                        onChange={(sortOrder) =>
                          setForm((f) => ({ ...f, sortOrder }))
                        }
                      />
                    )}
                  </div>
                  <Field
                    label="URL 주소"
                    value={form.slug}
                    onChange={(slug) => setForm((f) => ({ ...f, slug }))}
                    mono
                  />
                </section>

                <section className="space-y-3">
                  <SectionTitle>수량</SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="최소 수량"
                      value={form.minQuantity}
                      onChange={(minQuantity) =>
                        setForm((f) => ({ ...f, minQuantity }))
                      }
                    />
                    <Field
                      label="최대 수량"
                      value={form.maxQuantity}
                      onChange={(maxQuantity) =>
                        setForm((f) => ({ ...f, maxQuantity }))
                      }
                    />
                  </div>
                  {form.saleType === "CUSTOM" && (
                    <Field
                      label="목록 정렬"
                      value={form.sortOrder}
                      onChange={(sortOrder) =>
                        setForm((f) => ({ ...f, sortOrder }))
                      }
                    />
                  )}
                </section>

                <section className="space-y-3">
                  <SectionTitle>소개</SectionTitle>
                  <Field
                    label="한 줄 설명"
                    value={form.shortDesc}
                    onChange={(shortDesc) =>
                      setForm((f) => ({ ...f, shortDesc }))
                    }
                    placeholder="목록·검색에 보이는 짧은 소개"
                  />
                  <label className="block text-sm">
                    <span className="mb-1.5 block text-xs font-medium text-slate-500">
                      상세 설명
                    </span>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      className={`${inputClass} min-h-[96px] resize-y`}
                    />
                  </label>
                  <AdminImageUploadField
                    label="썸네일"
                    value={form.thumbnailUrl}
                    onChange={(thumbnailUrl) =>
                      setForm((f) => ({ ...f, thumbnailUrl }))
                    }
                  />
                </section>

                <div className="flex flex-wrap gap-2 sm:hidden">
                  <Check
                    label="판매중"
                    checked={form.isActive}
                    onChange={(isActive) =>
                      setForm((f) => ({ ...f, isActive }))
                    }
                  />
                  <Check
                    label="BEST"
                    checked={form.isFeatured}
                    onChange={(isFeatured) =>
                      setForm((f) => ({ ...f, isFeatured }))
                    }
                  />
                  <Check
                    label="NEW"
                    checked={form.isNew}
                    onChange={(isNew) => setForm((f) => ({ ...f, isNew }))}
                  />
                </div>

                {form.saleType === "CUSTOM" && !editingId && (
                  <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-800">
                    상품을 먼저 저장하면, 수정 화면에서 빌더 목업을 등록할 수
                    있습니다.
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </div>

              {form.saleType === "CUSTOM" && (
                <div className="min-h-0 overflow-y-auto border-t border-slate-100 bg-slate-50 lg:border-l lg:border-t-0">
                  {editingId ? (
                    <AdminProductMockupEditor
                      ref={mockupRef}
                      productId={editingId}
                    />
                  ) : (
                    <div className="flex h-full min-h-[240px] items-center justify-center px-8 text-center">
                      <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                        상품을 저장한 뒤 여기에서 면별 목업과 인쇄 영역을
                        설정할 수 있습니다.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-3.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
      {children}
    </h3>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

function Field({
  label,
  value,
  onChange,
  mono,
  hint,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  hint?: string;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </span>
      <div className="relative">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${mono ? "font-mono text-xs" : ""} ${
            suffix ? "pr-10" : ""
          }`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        checked
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: "slate" | "emerald" | "teal" | "indigo";
}) {
  const colors = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    teal: "text-teal-700",
    indigo: "text-indigo-700",
  };
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${colors[accent]}`}>
        {value}
      </p>
    </div>
  );
}

function ProductThumb({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-cover"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-300">
      <ImageIcon className="h-5 w-5" aria-hidden />
      <span className="sr-only">{name}</span>
    </div>
  );
}

function SaleTypeBadge({ saleType }: { saleType: ProductSaleType }) {
  const readymade = saleType === "READYMADE";
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
        readymade
          ? "bg-slate-100 text-slate-600"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {readymade ? "기성" : "커스텀"}
    </span>
  );
}

function ToggleChip({
  label,
  active,
  disabled,
  onClick,
  variant = "slate",
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  variant?: "slate" | "indigo" | "sky";
}) {
  const activeStyles = {
    slate: "bg-emerald-600 text-white",
    indigo: "bg-indigo-600 text-white",
    sky: "bg-sky-600 text-white",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-50 ${
        active
          ? activeStyles[variant]
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
