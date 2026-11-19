/** 스토어프론트 상품 목록·헤더 카테고리 (DB 시드와 동기화) */
export type StorefrontCategoryDef = {
  slug: string;
  name: string;
  sortOrder: number;
};

export const STOREFRONT_CATEGORY_DEFS: StorefrontCategoryDef[] = [
  { slug: "ecobag-tote", name: "에코백·토트백", sortOrder: 1 },
  { slug: "drawstring-pouch", name: "조리개 파우치·더스트백", sortOrder: 2 },
  { slug: "flat-dust-bag", name: "덮개형·플랫 더스트백", sortOrder: 3 },
  { slug: "zipper-pouch", name: "지퍼파우치", sortOrder: 4 },
  { slug: "nonwoven", name: "부직포 제품", sortOrder: 5 },
  { slug: "custom-bags", name: "기타가방·특수제작", sortOrder: 6 },
];

/** 이전 3분류 등 — 시드에서 비활성 처리 */
export const LEGACY_STOREFRONT_CATEGORY_SLUGS = [
  "ecobag",
  "shopping-bag",
  "pouch",
  "fabric-bags",
];
