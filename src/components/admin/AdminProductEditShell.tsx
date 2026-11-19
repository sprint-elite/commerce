"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
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
import { AdminProductContentEditor } from "./AdminProductContentEditor";
import { AdminImageUploadField } from "./AdminImageUploadField";

type TabId = "basic" | "content";

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

function toForm(p: AdminProductDto): FormState {
  return {
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
  };
}

export function AdminProductEditShell({
  product,
  categories,
  initialTab = "basic",
}: {
  product: AdminProductDto;
  categories: AdminCategoryDto[];
  initialTab?: TabId;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(
    initialTab === "content" ? "content" : "basic",
  );
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState(product.name);
  const mockupRef = useRef<AdminProductMockupEditorHandle | null>(null);

  const tabs = useMemo(
    () =>
      [
        { id: "basic" as const, label: "기본 정보" },
        {
          id: "content" as const,
          label:
            form.saleType === "READYMADE"
              ? "상세 · 재고"
              : "상세 · 갤러리",
        },
      ] as const,
    [form.saleType],
  );

  const switchTab = (next: TabId) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    router.replace(url.pathname + "?" + url.searchParams.toString());
  };

  const saveBasic = async () => {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      if (form.saleType === "CUSTOM" && mockupRef.current) {
        await mockupRef.current.save();
      }
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim().toLowerCase() || slugify(form.name),
          shortDesc: form.shortDesc,
          description: form.description,
          basePrice: Number(form.basePrice),
          minQuantity: Number(form.minQuantity),
          maxQuantity: Number(form.maxQuantity),
          thumbnailUrl: form.thumbnailUrl,
          saleType: form.saleType,
          builderType: form.builderType,
          categoryId: form.categoryId || null,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
          isNew: form.isNew,
        }),
      });
      const data = (await res.json()) as {
        products?: AdminProductDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      const updated = data.products?.find((p) => p.id === product.id);
      if (updated) {
        setForm(toForm(updated));
        setName(updated.name);
      }
      setMsg("기본 정보를 저장했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/products"
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            ← 상품 목록
          </Link>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900">
            {name}
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-400">{form.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/products/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            스토어 보기
          </Link>
          {tab === "basic" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveBasic()}
              className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              기본 정보 저장
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex gap-0 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {msg && tab === "basic" ? (
        <p className="mt-4 text-sm text-emerald-700">{msg}</p>
      ) : null}

      {tab === "basic" ? (
        <div
          className={`mt-6 ${
            form.saleType === "CUSTOM"
              ? "grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]"
              : ""
          }`}
        >
          <div className="space-y-5 border border-slate-200 bg-white p-5">
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                판매 구분
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCT_SALE_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className={`cursor-pointer border p-3 text-sm ${
                      form.saleType === t.value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 hover:bg-slate-50"
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
                      className={`mt-1 block text-[11px] ${
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
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                기본 정보
              </h2>
              <Field
                label="상품명"
                value={form.name}
                onChange={(name) => setForm((f) => ({ ...f, name }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-slate-500">
                    카테고리
                  </span>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, categoryId: e.target.value }))
                    }
                    className="w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">선택 안 함</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="슬러그"
                  value={form.slug}
                  onChange={(slug) => setForm((f) => ({ ...f, slug }))}
                  mono
                />
              </div>
              <Field
                label="한 줄 설명"
                value={form.shortDesc}
                onChange={(shortDesc) => setForm((f) => ({ ...f, shortDesc }))}
              />
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-slate-500">상세 설명</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </label>
            </section>

            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                가격 · 수량
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <Field
                  label="기본가"
                  value={form.basePrice}
                  onChange={(basePrice) => setForm((f) => ({ ...f, basePrice }))}
                />
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
              {form.saleType === "CUSTOM" ? (
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-slate-500">
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
                    className="w-full border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    {BUILDER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  재고 수량은 <strong>상세 · 재고</strong> 탭에서 관리합니다.
                </p>
              )}
              <AdminImageUploadField
                label="썸네일"
                value={form.thumbnailUrl}
                onChange={(thumbnailUrl) =>
                  setForm((f) => ({ ...f, thumbnailUrl }))
                }
              />
              <Field
                label="정렬"
                value={form.sortOrder}
                onChange={(sortOrder) => setForm((f) => ({ ...f, sortOrder }))}
              />
            </section>

            <section className="flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
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
            </section>
          </div>

          {form.saleType === "CUSTOM" ? (
            <div className="min-h-[420px] border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                목업
              </h2>
              <AdminProductMockupEditor
                ref={mockupRef}
                productId={product.id}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-6">
          <AdminProductContentEditor
            productId={product.id}
            productName={name}
            embedded
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 ${
          mono ? "font-mono text-xs" : ""
        }`}
      />
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
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
