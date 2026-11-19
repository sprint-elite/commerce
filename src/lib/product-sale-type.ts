import type { ProductSaleType } from "@prisma/client";

export type { ProductSaleType };

export const PRODUCT_SALE_TYPES: {
  value: ProductSaleType;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: "CUSTOM",
    label: "커스텀 상품",
    shortLabel: "커스텀",
    description: "에디터로 디자인해 주문합니다.",
  },
  {
    value: "READYMADE",
    label: "기성품",
    shortLabel: "기성품",
    description: "수량만 입력해 주문합니다.",
  },
];

export function isProductSaleType(value: unknown): value is ProductSaleType {
  return value === "CUSTOM" || value === "READYMADE";
}

export function saleTypeLabel(saleType: ProductSaleType): string {
  return (
    PRODUCT_SALE_TYPES.find((t) => t.value === saleType)?.shortLabel ??
    saleType
  );
}
