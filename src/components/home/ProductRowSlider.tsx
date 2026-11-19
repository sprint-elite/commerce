import type { CatalogProductDto } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

interface ProductRowSliderProps {
  items: CatalogProductDto[];
  compact?: boolean;
  /** lg 기준 한 줄에 보이는 카드 수 (2 | 3 | 4 | 6) */
  perRowLg?: 2 | 3 | 4 | 6;
}

const widthClass: Record<2 | 3 | 4 | 6, string> = {
  2: "w-[calc(50%-0.375rem)]",
  3: "w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.67rem)]",
  4: "w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.67rem)] lg:w-[calc(25%-0.75rem)]",
  6: "w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.67rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(16.666%-0.83rem)]",
};

/** 한 줄만 보이고 나머지는 가로 스크롤 */
export function ProductRowSlider({
  items,
  compact,
  perRowLg = 6,
}: ProductRowSliderProps) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-hide snap-x snap-mandatory sm:gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className={`${widthClass[perRowLg]} shrink-0 snap-start`}
        >
          <ProductCard item={item} compact={compact} />
        </div>
      ))}
    </div>
  );
}
