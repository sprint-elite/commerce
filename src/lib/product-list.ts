import type { ProductType } from "@/types/builder";
import { fetchStorefrontCategories } from "@/lib/admin-catalog";
import { STOREFRONT_CATEGORY_DEFS } from "@/lib/storefront-categories";

export type ProductListSort = "recommended" | "price-asc" | "price-desc";

export type ProductListCategory = {
  slug: string | null;
  label: string;
  heading: string;
};

/** 헤더 등 클라이언트용 기본 카테고리 (DB와 시드 동기화) */
export const FALLBACK_PRODUCT_LIST_CATEGORIES: ProductListCategory[] = [
  { slug: null, label: "전체", heading: "전체 상품" },
  ...STOREFRONT_CATEGORY_DEFS.map((c) => ({
    slug: c.slug,
    label: c.name,
    heading: c.name,
  })),
];

export const PRODUCT_LIST_SORT_OPTIONS: {
  value: ProductListSort;
  label: string;
}[] = [
  { value: "recommended", label: "추천순" },
  { value: "price-asc", label: "낮은 가격순" },
  { value: "price-desc", label: "높은 가격순" },
];

export async function fetchProductListCategories(): Promise<
  ProductListCategory[]
> {
  const rows = await fetchStorefrontCategories();
  return [
    { slug: null, label: "전체", heading: "전체 상품" },
    ...rows.map((c) => ({
      slug: c.slug,
      label: c.name,
      heading: c.name,
    })),
  ];
}

export async function isValidListCategory(slug: string): Promise<boolean> {
  const cats = await fetchProductListCategories();
  return cats.some((c) => c.slug === slug);
}

export async function getListCategory(
  slug: string | null,
): Promise<ProductListCategory> {
  const cats = await fetchProductListCategories();
  return cats.find((c) => c.slug === slug) ?? cats[0];
}

export function parseProductListSort(value: string | undefined): ProductListSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "recommended";
}

export function listCategoryHref(slug: string | null): string {
  return slug ? `/products/list/${slug}` : "/products/list";
}

export function categoryNavHref(slug: string | null): string {
  return listCategoryHref(slug);
}

/** @deprecated 목록은 카테고리 기준 — productType은 상품 builderType 사용 */
export function productTypeFromListSlug(
  _slug: string | null,
): ProductType | null {
  return null;
}
