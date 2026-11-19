"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import type {
  CatalogProductDto,
  ProductDetailDto,
  ProductDetailSectionDto,
  ProductReviewDto,
} from "@/lib/catalog";
import { PRODUCT_PAGE_CONTAINER } from "@/lib/product-layout";
import { ProductCard } from "@/components/home/ProductCard";
import { ProductReviewForm } from "@/components/product/ProductReviewForm";

const CUSTOM_TABS = [
  { id: "story", label: "스토리" },
  { id: "info", label: "상품 정보" },
  { id: "guide", label: "제작 가이드" },
  { id: "reviews", label: "리뷰" },
  { id: "faq", label: "자주 묻는 질문" },
] as const;

const READYMADE_TABS = [
  { id: "info", label: "상세정보" },
  { id: "reviews", label: "상품후기" },
] as const;

type TabId = (typeof CUSTOM_TABS)[number]["id"];

const SECTION_TITLES: Record<TabId, string> = {
  story: "스토리",
  info: "상세정보",
  guide: "제작 가이드",
  reviews: "상품후기",
  faq: "자주 묻는 질문",
};

const TAB_SECTION_TYPES: Record<TabId, string[]> = {
  story: ["STORY"],
  info: ["INFO"],
  guide: ["GUIDE", "SIZE"],
  reviews: [],
  faq: ["FAQ"],
};

interface ProductDetailSectionsProps {
  product: ProductDetailDto;
  wide?: boolean;
}

function sectionsForTab(
  sections: ProductDetailSectionDto[],
  tab: TabId,
): ProductDetailSectionDto[] {
  const types = TAB_SECTION_TYPES[tab];
  return sections.filter((s) => types.includes(s.type));
}

function SectionBlocks({ items }: { items: ProductDetailSectionDto[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-10">
      {items.map((item) => (
        <article key={item.id}>
          {item.type !== "FAQ" ? (
            <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
          ) : null}
          {item.imageUrl ? (
            <div className="relative mt-4 aspect-[16/9] overflow-hidden bg-zinc-100">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          ) : null}
          {item.type === "FAQ" ? (
            <FaqBody body={item.body} />
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
              {item.body}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

type FaqQa = { q: string; a: string };

function parseFaqBody(body: string): FaqQa[] | null {
  const trimmed = body.trim();
  if (!trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return null;
    const items = parsed
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as { q?: unknown; a?: unknown; question?: unknown; answer?: unknown };
        const q = String(r.q ?? r.question ?? "").trim();
        const a = String(r.a ?? r.answer ?? "").trim();
        if (!q || !a) return null;
        return { q, a };
      })
      .filter((x): x is FaqQa => x != null);
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

function FaqBody({ body }: { body: string }) {
  const items = parseFaqBody(body);
  if (!items) {
    return (
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
        {body}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-zinc-200 border-t border-zinc-200">
      {items.map((item, i) => (
        <li key={`${item.q}-${i}`} className="py-5">
          <p className="text-sm font-semibold text-zinc-900">Q. {item.q}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            A. {item.a}
          </p>
        </li>
      ))}
    </ul>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-zinc-400">{text}</p>;
}

function ReviewList({
  reviews,
  ratingAvg,
  reviewCount,
}: {
  reviews: ProductReviewDto[];
  ratingAvg: number;
  reviewCount: number;
}) {
  if (reviews.length === 0) {
    return <EmptyHint text="등록된 리뷰가 없습니다." />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">
        평균{" "}
        <span className="font-semibold text-zinc-900">
          {ratingAvg > 0 ? ratingAvg.toFixed(1) : "-"}
        </span>
        점 · 리뷰 {reviewCount.toLocaleString()}건
      </p>
      <ul className="divide-y divide-zinc-200 border-t border-zinc-200">
        {reviews.map((r) => (
          <li key={r.id} className="py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-800">
                  {r.userName}
                </span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </span>
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(r.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              {r.content}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedProducts({ products }: { products: CatalogProductDto[] }) {
  if (products.length === 0) return null;
  return (
    <section className="scroll-mt-24 border-t border-zinc-200 pt-12 sm:scroll-mt-28">
      <h2 className="text-xl font-bold text-zinc-900">함께 보면 좋은 상품</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {products.map((item) => (
          <ProductCard key={item.id} item={item} compact />
        ))}
      </div>
    </section>
  );
}

export function ProductDetailSections({
  product,
  wide = false,
}: ProductDetailSectionsProps) {
  const contentContainer = wide
    ? PRODUCT_PAGE_CONTAINER
    : "mx-auto max-w-5xl px-4 sm:px-6";

  const isReadyMade = product.saleType === "READYMADE";
  const tabs = isReadyMade ? READYMADE_TABS : CUSTOM_TABS;
  const [activeTab, setActiveTab] = useState<TabId>(
    isReadyMade ? "info" : "story",
  );

  const tabContent = useMemo(() => {
    return {
      story: sectionsForTab(product.sections, "story"),
      info: sectionsForTab(product.sections, "info"),
      guide: sectionsForTab(product.sections, "guide"),
      faq: sectionsForTab(product.sections, "faq"),
    };
  }, [product.sections]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const tab of tabs) {
      const el = document.getElementById(`detail-${tab.id}`);
      if (!el) continue;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActiveTab(tab.id);
          }
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      for (const o of observers) o.disconnect();
    };
  }, [tabs]);

  return (
    <div className="bg-white">
      <nav className="sticky top-14 z-40 border-b border-zinc-200 bg-white sm:top-16">
        <div
          className={`flex gap-0 overflow-x-auto scrollbar-hide ${contentContainer}`}
        >
          {tabs.map((tab) => (
            <a
              key={tab.id}
              href={`#detail-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-4 text-sm font-medium transition-colors sm:px-5 ${
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab.label}
              {tab.id === "reviews" && product.reviewCount > 0
                ? ` ${product.reviewCount}`
                : ""}
            </a>
          ))}
        </div>
      </nav>

      <div className={`space-y-16 py-12 ${contentContainer}`}>
        {!isReadyMade ? (
          <section
            id="detail-story"
            className="scroll-mt-24 sm:scroll-mt-28"
          >
            <h2 className="text-xl font-bold text-zinc-900">
              {SECTION_TITLES.story}
            </h2>
            <div className="mt-8">
              {tabContent.story.length > 0 ? (
                <SectionBlocks items={tabContent.story} />
              ) : product.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                  {product.description}
                </p>
              ) : (
                <EmptyHint text="등록된 스토리 콘텐츠가 없습니다." />
              )}
            </div>
          </section>
        ) : null}

        <section id="detail-info" className="scroll-mt-24 sm:scroll-mt-28">
          <h2 className="text-xl font-bold text-zinc-900">
            {SECTION_TITLES.info}
          </h2>
          <div className="mt-8 space-y-8">
            {(product.shortDesc || product.description) && (
              <div>
                {product.shortDesc ? (
                  <p className="text-sm font-medium text-zinc-800">
                    {product.shortDesc}
                  </p>
                ) : null}
                {product.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                    {product.description}
                  </p>
                ) : null}
                <dl className="mt-6 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
                  <div>
                    <dt className="text-zinc-400">주문 수량</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-900">
                      {product.minQuantity}~{product.maxQuantity}개
                    </dd>
                  </div>
                  {product.categoryName ? (
                    <div>
                      <dt className="text-zinc-400">카테고리</dt>
                      <dd className="mt-0.5 font-semibold text-zinc-900">
                        {product.categoryName}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            )}
            {product.noticeItems.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  상품정보제공고시
                </h3>
                <dl className="mt-3 divide-y divide-zinc-200 border-y border-zinc-200">
                  {product.noticeItems.map((item) => (
                    <div
                      key={`${item.label}-${item.value.slice(0, 12)}`}
                      className="grid grid-cols-[8rem_1fr] gap-3 py-3 text-sm sm:grid-cols-[10rem_1fr]"
                    >
                      <dt className="text-zinc-500">{item.label}</dt>
                      <dd className="whitespace-pre-wrap text-zinc-800">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            <SectionBlocks items={tabContent.info} />
            {!product.shortDesc &&
              !product.description &&
              product.noticeItems.length === 0 &&
              tabContent.info.length === 0 && (
                <EmptyHint text="등록된 상품 정보가 없습니다." />
              )}
          </div>
        </section>

        {!isReadyMade ? (
          <section id="detail-guide" className="scroll-mt-24 sm:scroll-mt-28">
            <h2 className="text-xl font-bold text-zinc-900">
              {SECTION_TITLES.guide}
            </h2>
            <div className="mt-8">
              {tabContent.guide.length > 0 ? (
                <SectionBlocks items={tabContent.guide} />
              ) : (
                <EmptyHint text="등록된 제작 가이드가 없습니다." />
              )}
            </div>
          </section>
        ) : null}

        <section id="detail-reviews" className="scroll-mt-24 sm:scroll-mt-28">
          <h2 className="text-xl font-bold text-zinc-900">
            {SECTION_TITLES.reviews}
          </h2>
          <div className="mt-8 space-y-8">
            <ProductReviewForm productSlug={product.slug} />
            <ReviewList
              reviews={product.reviews}
              ratingAvg={product.ratingAvg}
              reviewCount={product.reviewCount}
            />
          </div>
        </section>

        {!isReadyMade ? (
          <section id="detail-faq" className="scroll-mt-24 sm:scroll-mt-28">
            <h2 className="text-xl font-bold text-zinc-900">
              {SECTION_TITLES.faq}
            </h2>
            <div className="mt-8">
              {tabContent.faq.length > 0 ? (
                <SectionBlocks items={tabContent.faq} />
              ) : (
                <EmptyHint text="등록된 FAQ가 없습니다." />
              )}
            </div>
          </section>
        ) : null}

        <RelatedProducts products={product.related} />
      </div>
    </div>
  );
}
