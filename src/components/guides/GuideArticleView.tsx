import Link from "next/link";
import Image from "next/image";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RelatedIdeasSidebar } from "@/components/guides/RelatedIdeasSidebar";
import type { GuideArticle } from "@/lib/guide-articles";
import type { HomeContentCard } from "@/lib/content-article";
import type { ContentArticleType } from "@/lib/content-article-types";
import { PRODUCT_DISPLAY_IMAGES } from "@/lib/home-data";
import type { ProductType } from "@/types/builder";

export type GuideProductCard = {
  slug: string;
  name: string;
  shortDesc: string | null;
  basePrice: number;
  saleType: string;
  productType: ProductType;
  caption?: string;
};

interface GuideArticleViewProps {
  article: GuideArticle & {
    type?: ContentArticleType;
    coverImageUrl?: string | null;
  };
  productsBySlug: Record<string, GuideProductCard>;
  /** IDEA 상세 우측 — 상황별 추천 */
  relatedIdeas?: HomeContentCard[];
}

function ProductPickGrid({
  picks,
  productsBySlug,
}: {
  picks: { slug: string; caption?: string }[];
  productsBySlug: Record<string, GuideProductCard>;
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {picks.map((pick) => {
        const p = productsBySlug[pick.slug];
        if (!p) return null;
        const img = PRODUCT_DISPLAY_IMAGES[p.productType];
        return (
          <Link
            key={pick.slug}
            href={`/products/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-400"
          >
            <div className="relative aspect-square bg-zinc-50">
              {img ? (
                <Image
                  src={img}
                  alt={p.name}
                  fill
                  className="object-contain p-4 transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 45vw, 200px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                  {p.name}
                </div>
              )}
              {p.saleType === "READYMADE" ? (
                <span className="absolute left-2 top-2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  기성
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col px-3 py-3">
              <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
                {p.name}
              </p>
              {(pick.caption || p.shortDesc) && (
                <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                  {pick.caption ?? p.shortDesc}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function GuideArticleView({
  article,
  productsBySlug,
  relatedIdeas = [],
}: GuideArticleViewProps) {
  const kind =
    article.type === "IDEA" || article.type === "CASE" ? article.type : "GUIDE";
  const listHref =
    kind === "IDEA" ? "/templates" : kind === "CASE" ? "/#cases" : "/#guides";
  const listLabel =
    kind === "IDEA"
      ? "2분컷 템플릿"
      : kind === "CASE"
        ? "제작 사례"
        : "제작 가이드";
  const showSidebar = kind === "IDEA" && relatedIdeas.length > 0;
  const coverClass =
    kind === "CASE" ? "object-contain p-8" : "object-cover";

  const articleBody = (
    <>
      {kind === "IDEA" || kind === "CASE" ? (
        <>
          {kind === "CASE" ? (
            <Link
              href={listHref}
              className="mb-4 inline-block text-xs font-semibold leading-none tracking-wide text-zinc-400 hover:text-zinc-700"
            >
              {listLabel}
            </Link>
          ) : null}
          {article.coverImageUrl ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-50">
              <Image
                src={article.coverImageUrl}
                alt={article.title}
                fill
                className={coverClass}
                sizes="(max-width: 1024px) 100vw, 720px"
                priority
              />
            </div>
          ) : null}
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-2 text-base leading-relaxed text-zinc-600">
            {article.subtitle}
          </p>
        </>
      ) : (
        <>
          <Link
            href={listHref}
            className="inline-block text-xs font-semibold leading-none tracking-wide text-zinc-400 hover:text-zinc-700"
          >
            {listLabel}
          </Link>
          <p className="mt-3 text-xs text-zinc-400">{article.date}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            {article.subtitle}
          </p>
          {article.coverImageUrl ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100">
              <Image
                src={article.coverImageUrl}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 720px"
                priority
              />
            </div>
          ) : null}
        </>
      )}

      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-zinc-700">
        {article.intro.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>

      <div className="mt-14 space-y-16">
        {article.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-zinc-700">
              {section.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>

            {section.tips && section.tips.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4">
                <p className="text-sm font-bold text-zinc-900">
                  {section.tipsTitle ?? "참고"}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-zinc-600">
                  {section.tips.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {section.products && section.products.length > 0 ? (
              <div className="mt-8">
                <p className="text-sm font-bold text-zinc-900">
                  {section.productsTitle ?? "추천 상품"}
                </p>
                <ProductPickGrid
                  picks={section.products}
                  productsBySlug={productsBySlug}
                />
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {article.faq.length > 0 ? (
        <section className="mt-16 border-t border-zinc-200 pt-12">
          <h2 className="text-xl font-bold text-zinc-900">자주 묻는 질문</h2>
          <dl className="mt-6 space-y-6">
            {article.faq.map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-bold text-zinc-900">Q. {item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-zinc-600">
                  A. {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <div className="mt-14 flex flex-wrap gap-3 border-t border-zinc-200 pt-8">
        <Link
          href={listHref}
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          {listLabel} 모아보기
        </Link>
        <Link
          href="/products/list"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          상품 전체 보기
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      {showSidebar ? (
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-x-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="min-w-0">
            <Link
              href={listHref}
              className="mb-3 inline-block text-sm font-bold leading-none tracking-wide text-zinc-400 hover:text-zinc-700"
            >
              {listLabel}
            </Link>
            <article>{articleBody}</article>
          </div>
          <RelatedIdeasSidebar items={relatedIdeas} />
        </div>
      ) : (
        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {articleBody}
        </article>
      )}

      <HomeFooter />
    </div>
  );
}
