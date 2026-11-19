"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { CatalogProductDto } from "@/lib/catalog";
import { ProductCard } from "@/components/home/ProductCard";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PRODUCT_PAGE_CONTAINER } from "@/lib/product-layout";
import type { ProductSaleType } from "@/lib/product-sale-type";
import {
  listCategoryHref,
  PRODUCT_LIST_SORT_OPTIONS,
  type ProductListCategory,
  type ProductListSort,
} from "@/lib/product-list";

type SaleFilter = "ALL" | ProductSaleType;

interface ProductListPageProps {
  categorySlug: string | null;
  products: CatalogProductDto[];
  sort: ProductListSort;
  counts: Record<string, number>;
  listCategories: ProductListCategory[];
  searchQuery?: string;
}

function buildListUrl(
  categorySlug: string | null,
  sort: ProductListSort,
): string {
  const base = listCategoryHref(categorySlug);
  if (sort === "recommended") return base;
  return `${base}?sort=${sort}`;
}

export function ProductListPage({
  categorySlug,
  products,
  sort,
  counts,
  listCategories,
  searchQuery = "",
}: ProductListPageProps) {
  const category =
    listCategories.find((c) => c.slug === categorySlug) ?? listCategories[0];
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [saleFilter, setSaleFilter] = useState<SaleFilter>("ALL");

  const q = searchQuery.trim().toLowerCase();

  const visible = useMemo(() => {
    return products.filter((p) => {
      if (saleFilter !== "ALL" && p.saleType !== saleFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.shortDesc?.toLowerCase().includes(q) ?? false) ||
        (p.categorySlug?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, saleFilter, q]);

  const heading = q
    ? `"${searchQuery.trim()}" 검색 결과`
    : (category?.heading ?? "전체 상품");

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader wide />

      <div className={`${PRODUCT_PAGE_CONTAINER} py-6 sm:py-8`}>
        <div className="flex gap-8 lg:gap-10">
          <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
            <ProductListSidebar
              activeSlug={categorySlug}
              counts={counts}
              categories={listCategories}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <ProductListCategoryBar
              activeSlug={categorySlug}
              categories={listCategories}
            />
            <div className="border-b border-zinc-200 pb-5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-[1.75rem]">
                {heading}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                총 {visible.length.toLocaleString()}개의 상품
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    { value: "ALL", label: "전체" },
                    { value: "CUSTOM", label: "커스텀" },
                    { value: "READYMADE", label: "기성품" },
                  ] as { value: SaleFilter; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSaleFilter(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      saleFilter === opt.value
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 py-4">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                필터
              </button>

              <div className="relative ml-auto">
                <label className="sr-only" htmlFor="product-sort">
                  정렬
                </label>
                <div className="relative">
                  <select
                    id="product-sort"
                    value={sort}
                    onChange={(e) => {
                      window.location.href = buildListUrl(
                        categorySlug,
                        e.target.value as ProductListSort,
                      );
                    }}
                    className="appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                  >
                    {PRODUCT_LIST_SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>
            </div>

            {mobileFiltersOpen && (
              <div className="border-b border-zinc-100 py-4 lg:hidden">
                <ProductListSidebar
                  activeSlug={categorySlug}
                  counts={counts}
                  categories={listCategories}
                  onNavigate={() => setMobileFiltersOpen(false)}
                />
              </div>
            )}

            {visible.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {visible.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-base font-semibold text-zinc-800">
                  표시할 상품이 없습니다
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  다른 구분이나 카테고리를 선택해 보세요.
                </p>
                <Link
                  href="/products/list"
                  className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  전체 상품 보기
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <HomeFooter wide />
    </div>
  );
}

function ProductListCategoryBar({
  activeSlug,
  categories,
}: {
  activeSlug: string | null;
  categories: ProductListCategory[];
}) {
  return (
    <nav
      aria-label="상품 카테고리"
      className="mb-5 flex flex-wrap gap-2 sm:gap-2.5"
    >
      {categories.map((cat) => {
        const active = cat.slug === activeSlug;
        return (
          <Link
            key={cat.slug ?? "all"}
            href={listCategoryHref(cat.slug)}
            className={`border px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500"
            }`}
          >
            {cat.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ProductListSidebar({
  activeSlug,
  counts,
  categories,
  onNavigate,
}: {
  activeSlug: string | null;
  counts: Record<string, number>;
  categories: ProductListCategory[];
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="상품 카테고리">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
        All
      </p>
      <ul className="space-y-0.5">
        {categories.map((cat) => {
          const href = listCategoryHref(cat.slug);
          const active = cat.slug === activeSlug;
          const countKey = cat.slug ?? "all";
          const count = counts[countKey] ?? 0;

          return (
            <li key={cat.slug ?? "all"}>
              <Link
                href={href}
                onClick={onNavigate}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-zinc-900 font-semibold text-white"
                    : "font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-xs ${
                    active ? "text-zinc-300" : "text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
