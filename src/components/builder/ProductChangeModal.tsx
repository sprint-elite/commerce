"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import type { ProductSaleType } from "@/lib/product-sale-type";
import { STOREFRONT_CATEGORY_DEFS } from "@/lib/storefront-categories";
import type { ProductType } from "@/types/builder";
import { PRODUCT_DISPLAY_IMAGES, PRODUCT_GRADIENTS } from "@/lib/home-data";
import { ProductVisual } from "@/components/home/ProductVisual";

export type BuilderProductOption = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  basePrice: number;
  thumbnailUrl: string | null;
  saleType: ProductSaleType;
  productType: ProductType;
  categoryName: string | null;
  categorySlug?: string | null;
  isFeatured?: boolean;
};

interface ProductChangeModalProps {
  open: boolean;
  currentSlug?: string | null;
  /** 첫 진입 선택 모드 (상품 변경과 문구 구분) */
  mode?: "select" | "change";
  onClose: () => void;
  onSelect: (product: BuilderProductOption) => void;
}

function splitProductRails(
  products: BuilderProductOption[],
  currentSlug?: string | null,
) {
  const current = products.find((p) => p.slug === currentSlug) ?? null;

  const related = products.filter((p) => {
    if (p.slug === currentSlug) return true;
    if (current?.categorySlug) {
      return p.categorySlug === current.categorySlug;
    }
    if (current?.productType) {
      return p.productType === current.productType;
    }
    return true;
  });

  const relatedIds = new Set(related.map((p) => p.id));

  let recommended = products.filter((p) => p.isFeatured);
  if (recommended.length < 2) {
    recommended = products.filter(
      (p) => p.slug !== currentSlug || recommended.some((r) => r.id === p.id),
    );
  }

  if (current && !recommended.some((p) => p.id === current.id)) {
    recommended = [current, ...recommended];
  }

  let relatedFinal = related;
  if (relatedFinal.length < 2) {
    const extras = products.filter((p) => !relatedIds.has(p.id));
    relatedFinal = [...relatedFinal, ...extras].slice(0, 8);
  }

  return {
    related: relatedFinal,
    recommended: recommended.slice(0, 12),
  };
}

type CategoryTab = "all" | (typeof STOREFRONT_CATEGORY_DEFS)[number]["slug"];

const CATEGORY_TABS: { id: CategoryTab; label: string }[] = [
  { id: "all", label: "전체" },
  ...STOREFRONT_CATEGORY_DEFS.map((c) => ({
    id: c.slug as CategoryTab,
    label: c.name,
  })),
];

function matchesCategoryTab(
  product: BuilderProductOption,
  tab: CategoryTab,
): boolean {
  if (tab === "all") return true;
  return product.categorySlug === tab;
}

export function ProductChangeModal({
  open,
  currentSlug,
  mode = "change",
  onClose,
  onSelect,
}: ProductChangeModalProps) {
  const [products, setProducts] = useState<BuilderProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<CategoryTab>("all");

  useEffect(() => {
    if (!open) return;
    setTab("all");
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch("/api/products?saleType=CUSTOM");
        const data = (await res.json()) as {
          products?: BuilderProductOption[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "상품 목록을 불러오지 못했습니다.");
        }
        if (!cancelled) setProducts(data.products ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "상품 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesCategoryTab(p, tab)),
    [products, tab],
  );

  const { related, recommended } = useMemo(
    () => splitProductRails(filteredProducts, currentSlug),
    [filteredProducts, currentSlug],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-change-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h2
              id="product-change-title"
              className="text-lg font-bold tracking-tight text-zinc-900"
            >
              {mode === "select" ? "어떤 상품을 만들까요?" : "상품 변경"}
            </h2>
            {mode === "select" ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                카테고리에서 상품을 골라 주세요
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-zinc-100 bg-white px-4 py-2.5 scrollbar-hide sm:px-6"
          role="tablist"
          aria-label="상품 카테고리"
        >
          {CATEGORY_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-zinc-50 to-white py-4 sm:space-y-6 sm:py-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              불러오는 중…
            </div>
          )}
          {error && (
            <p className="py-16 text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && products.length === 0 && (
            <p className="py-16 text-center text-sm text-zinc-500">
              선택 가능한 커스텀 상품이 없습니다.
            </p>
          )}
          {!loading &&
            !error &&
            products.length > 0 &&
            filteredProducts.length === 0 && (
              <p className="py-16 text-center text-sm text-zinc-500">
                이 카테고리에 표시할 상품이 없습니다.
              </p>
            )}

          {!loading && !error && filteredProducts.length > 0 && (
            <>
              <ProductRail
                title="관련 상품"
                products={related}
                currentSlug={currentSlug}
                selectMode={mode === "select"}
                scrollActiveIntoView
                onSelect={onSelect}
              />
              <ProductRail
                title="추천 상품"
                products={recommended}
                currentSlug={currentSlug}
                selectMode={mode === "select"}
                onSelect={onSelect}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductRail({
  title,
  products,
  currentSlug,
  selectMode,
  scrollActiveIntoView = false,
  onSelect,
}: {
  title: string;
  products: BuilderProductOption[];
  currentSlug?: string | null;
  selectMode?: boolean;
  /** 관련 상품만 현재 상품 위치로 스크롤. 추천 상품은 0부터 보여 양쪽 잘림 방지 */
  scrollActiveIntoView?: boolean;
  onSelect: (product: BuilderProductOption) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  }>({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = trackRef.current;
      if (!el) {
        updateArrows();
        return;
      }
      if (!scrollActiveIntoView || !currentSlug) {
        el.scrollLeft = 0;
        updateArrows();
        return;
      }
      const active = el.querySelector<HTMLElement>(
        `[data-slug="${CSS.escape(currentSlug)}"]`,
      );
      active?.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "auto",
      });
      updateArrows();
    });
    return () => cancelAnimationFrame(id);
  }, [products, currentSlug, updateArrows, scrollActiveIntoView]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-product-card]");
    const step = card ? card.offsetWidth + 12 : el.clientWidth * 0.7;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  /**
   * 데스크탑 클릭이 막히던 원인:
   * pointerdown 즉시 setPointerCapture + 미세 이동만으로도 scrollLeft를 바꿔
   * 브라우저가 button click을 취소했음.
   * → 마우스만, 8px 이상 움직인 뒤에야 드래그 시작.
   */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.pointerType !== "mouse") return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: trackRef.current?.scrollLeft ?? 0,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = trackRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active || e.pointerType !== "mouse") return;

    const dx = e.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < 8) return;
      drag.moved = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add("cursor-grabbing");
    }

    el.scrollLeft = drag.scrollLeft - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    const el = trackRef.current;
    const drag = dragRef.current;
    if (!drag.active) return;
    const wasDragging = drag.moved;
    drag.active = false;

    if (el && wasDragging) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      el.classList.remove("cursor-grabbing");
      window.setTimeout(() => {
        drag.moved = false;
      }, 50);
    } else {
      drag.moved = false;
    }
  };

  const handleCardClick = (product: BuilderProductOption) => {
    if (dragRef.current.moved) return;
    onSelect(product);
  };

  if (products.length === 0) return null;

  return (
    <section className="relative">
      <div className="mb-2 flex items-center justify-between px-5 sm:px-6">
        <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
        <div className="hidden gap-1.5 sm:flex">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`${title} 이전`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`${title} 다음`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={updateArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-0.5 select-none scrollbar-hide sm:gap-3.5 sm:px-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {products.map((p) => {
          const active = p.slug === currentSlug;
          const imageSrc =
            p.thumbnailUrl || PRODUCT_DISPLAY_IMAGES[p.productType];
          return (
            <article
              key={`${title}-${p.id}`}
              data-slug={p.slug}
              data-product-card
              className="w-[42%] max-w-[148px] shrink-0 snap-start sm:w-[140px]"
            >
              <button
                type="button"
                onClick={() => handleCardClick(p)}
                className={`group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  active
                    ? "border-rose-300 ring-2 ring-rose-200"
                    : "border-zinc-200/80 hover:border-zinc-300"
                }`}
              >
                <div
                  className={`relative aspect-square overflow-hidden ${
                    imageSrc
                      ? "bg-zinc-100"
                      : `bg-gradient-to-br ${PRODUCT_GRADIENTS[p.productType]}`
                  }`}
                >
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={p.name}
                      draggable={false}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full scale-90 items-center justify-center">
                      <ProductVisual
                        productType={p.productType}
                        color="mint"
                        size="sm"
                      />
                    </div>
                  )}
                  {active && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-rose-200">
                      {selectMode ? "이 페이지" : "현재"}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col px-2.5 py-2">
                  <h4 className="truncate text-xs font-bold text-zinc-900">
                    {p.name}
                  </h4>
                  {p.shortDesc && (
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-500">
                      {p.shortDesc}
                    </p>
                  )}
                </div>
              </button>
            </article>
          );
        })}
        <div className="w-5 shrink-0 sm:w-6" aria-hidden />
      </div>
    </section>
  );
}
