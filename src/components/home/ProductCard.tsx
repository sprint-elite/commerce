import Image from "next/image";
import Link from "next/link";
import type { CatalogProductDto } from "@/lib/catalog";
import { PRODUCT_DISPLAY_IMAGES, PRODUCT_GRADIENTS } from "@/lib/home-data";
import { ProductVisual } from "./ProductVisual";

const PRODUCT_COLORS: Record<string, string> = {
  ecobag: "mint",
  "shopping-bag": "cream",
  pouch: "sky",
  b1: "mint",
  b2: "cream",
  b3: "sky",
  b4: "navy",
  b5: "cream",
  b6: "white",
  b7: "pink",
  b8: "mint",
};

const CIRCLE_SIZE = "h-32 w-32";

interface ProductCardProps {
  item: CatalogProductDto;
  compact?: boolean;
  /** circle: 메인 추천 섹션 — 원형 이미지 + 상품명만 */
  /** shop: 하이퀄리티 라인업 — 호버 커스텀 문구 없음 */
  variant?: "default" | "circle" | "shop";
  href?: string;
}

export function ProductCard({
  item,
  compact,
  variant = "default",
  href: hrefOverride,
}: ProductCardProps) {
  const href = hrefOverride ?? `/products/${item.slug}`;
  const imageSrc = item.thumbnailUrl || PRODUCT_DISPLAY_IMAGES[item.productType];
  const hasPhoto = Boolean(imageSrc);

  if (variant === "circle") {
    return (
      <Link
        href={href}
        className="group flex w-[7.5rem] flex-col items-center sm:w-32"
      >
        <div className="relative shrink-0">
          <div
            className={`relative ${CIRCLE_SIZE} overflow-hidden rounded-full ${
              hasPhoto
                ? "bg-zinc-100"
                : `bg-gradient-to-br ${PRODUCT_GRADIENTS[item.productType]}`
            }`}
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ProductVisual
                  productType={item.productType}
                  color={PRODUCT_COLORS[item.slug] ?? "mint"}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>

        <p className="mt-2.5 line-clamp-2 w-full text-center text-sm font-semibold leading-snug text-zinc-900">
          {item.name}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
    >
      <div
        className={`relative aspect-square overflow-hidden ${
          hasPhoto
            ? "bg-zinc-100"
            : `bg-gradient-to-br ${PRODUCT_GRADIENTS[item.productType]}`
        }`}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ProductVisual
              productType={item.productType}
              color={
                PRODUCT_COLORS[item.id] ?? PRODUCT_COLORS[item.slug] ?? "mint"
              }
              size={compact ? "sm" : "md"}
            />
          </div>
        )}

        {variant !== "shop" && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-zinc-900/90 px-3 py-3 text-center text-xs font-semibold text-white transition-transform duration-200 group-hover:translate-y-0 sm:text-sm">
            {item.saleType === "READYMADE"
              ? "기성품 구매하기"
              : "이 상품 커스텀하기"}
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-3.5"}`}>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
          {item.name}
        </p>
        {item.shortDesc ? (
          <p className="mt-2 line-clamp-1 text-xs leading-snug text-zinc-500">
            {item.shortDesc}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
