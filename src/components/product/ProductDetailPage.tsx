"use client";

import { useMemo } from "react";
import { BuilderPage } from "@/components/builder/BuilderPage";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import type { ProductDetailDto } from "@/lib/catalog";
import { toBuilderProductContext } from "@/lib/builder-product-context";
import { PRODUCT_PAGE_CONTAINER } from "@/lib/product-layout";
import { ProductDetailSections } from "./ProductDetailSections";
import { ReadyMadeProductView } from "./ReadyMadeProductView";
import { WishlistButton } from "./WishlistButton";

interface ProductDetailPageProps {
  product: ProductDetailDto;
}

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  const productContext = useMemo(
    () => toBuilderProductContext(product),
    [product],
  );

  const isReadyMade = product.saleType === "READYMADE";

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader wide />

      {isReadyMade ? (
        <ReadyMadeProductView product={product} />
      ) : (
        <>
          <div className="border-b border-zinc-200 bg-white">
            <div
              className={`${PRODUCT_PAGE_CONTAINER} flex flex-wrap items-center justify-between gap-3 py-3`}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  커스텀 제작
                </p>
                <h1 className="truncate text-base font-bold text-zinc-900 sm:text-lg">
                  {product.name}
                </h1>
                <p className="mt-0.5 text-xs text-zinc-500">
                  디자인 후 바로 주문 · 장바구니는 기성품 전용
                </p>
              </div>
              <WishlistButton productId={product.id} showLabel />
            </div>
          </div>
          <section
            id="studio"
            className="border-b border-zinc-200 bg-[#f5f5f5] py-[4px]"
            aria-label="디자인 편집기"
          >
            <div className={PRODUCT_PAGE_CONTAINER}>
              <BuilderPage
                embedded
                initialProductSlug={product.slug}
                productTitle={product.name}
                productType={product.productType}
                productContext={productContext}
              />
            </div>
          </section>
        </>
      )}

      <ProductDetailSections product={product} wide />

      <HomeFooter wide />
    </div>
  );
}
