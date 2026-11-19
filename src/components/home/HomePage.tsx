"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import { HomeHeader } from "./HomeHeader";
import { HomeFooter } from "./HomeFooter";
import { HeroCarousel } from "./HeroCarousel";
import { SectionHeader } from "./SectionHeader";
import { ProductCard } from "./ProductCard";
import { QuickTemplateCard } from "./QuickTemplateCard";
import type { HomeCatalogDto, HomeContentCardDto } from "@/lib/catalog";
import {
  GUIDE_CARDS,
  HOME_CASES_VIEW_ALL_URL,
  IDEA_BANNERS,
} from "@/lib/home-data";

interface HomePageProps {
  catalog: HomeCatalogDto;
}

const FALLBACK_IDEA_GRADIENTS = [
  "from-pink-200 to-rose-100",
  "from-amber-200 to-orange-100",
  "from-sky-200 to-blue-100",
  "from-emerald-200 to-green-100",
  "from-stone-200 to-zinc-100",
  "from-zinc-200 to-slate-100",
  "from-rose-100 to-orange-50",
  "from-yellow-100 to-amber-50",
];

const FALLBACK_GUIDE_GRADIENTS = [
  "from-teal-100 to-emerald-50",
  "from-orange-100 to-amber-50",
  "from-blue-100 to-sky-50",
  "from-stone-100 to-zinc-50",
];

function IdeasSection({
  ideas,
}: {
  ideas: {
    title: string;
    subtitle: string;
    href: string;
    gradient: string;
    imageUrl?: string;
  }[];
}) {
  return (
    <section id="ideas" className="bg-white pb-4 pt-10 sm:pb-6 sm:pt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          title="이런 상황엔, 이런 굿즈"
          subtitle="커플·행사·카페까지 활용 아이디어를 모아봤어요"
          href={ideas[0]?.href ?? "/ideas/couple-ecobag"}
          linkLabel="전체 보기"
        />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {ideas.slice(0, 4).map((idea) =>
            idea.imageUrl ? (
              <Link
                key={idea.title}
                href={idea.href}
                className="group relative aspect-[7/8] w-full overflow-hidden rounded-2xl transition-transform hover:scale-[1.02]"
              >
                <Image
                  src={idea.imageUrl}
                  alt={idea.title}
                  fill
                  className="object-cover object-[center_32%] transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 45vw, 280px"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/50 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3 pt-6 text-center sm:px-4 sm:pb-3.5">
                  <p className="text-[13px] font-semibold leading-snug text-white sm:text-sm">
                    {idea.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/80">
                    {idea.subtitle}
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                key={idea.title}
                href={idea.href}
                className={`group flex aspect-[7/8] w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${idea.gradient} p-4 text-center transition-transform hover:scale-[1.02]`}
              >
                <p className="mt-2 text-sm font-bold text-zinc-900">
                  {idea.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">{idea.subtitle}</p>
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function CasesSection({ cases }: { cases: HomeContentCardDto[] }) {
  const items = cases.slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section id="cases" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 sm:text-[11px]">
              Portfolio
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 sm:mt-2.5 sm:text-2xl">
              제작 사례
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              실제로 이렇게 만들어졌습니다.
            </p>
          </div>
          <a
            href={HOME_CASES_VIEW_ALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-0.5 self-start text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:self-auto"
          >
            사례 더보기
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-6">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-[1.125rem]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover object-center transition duration-500 ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 45vw, 280px"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
                  />
                )}
              </div>

              <div className="mt-3 flex items-center gap-2.5 sm:mt-4 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold leading-snug text-zinc-900 sm:text-base">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600 sm:mt-2 sm:text-sm">
                    {item.subtitle}
                  </p>
                </div>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition duration-300 group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white sm:h-9 sm:w-9"
                  aria-hidden
                >
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage({ catalog }: HomePageProps) {
  const { banners, best, templates, cases } = catalog;

  const ideas =
    catalog.ideas.length > 0
      ? catalog.ideas.map((b, i) => ({
          title: b.title,
          subtitle: b.subtitle,
          href: b.href,
          gradient:
            b.gradient ||
            FALLBACK_IDEA_GRADIENTS[i % FALLBACK_IDEA_GRADIENTS.length]!,
          imageUrl: b.imageUrl ?? undefined,
        }))
      : IDEA_BANNERS.map((b) => ({
          title: b.title,
          subtitle: b.subtitle,
          href: b.href,
          gradient: b.gradient,
          imageUrl: b.imageUrl,
        }));

  const guides =
    catalog.guides.length > 0
      ? catalog.guides.map((b, i) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          href: b.href,
          gradient:
            b.gradient ||
            FALLBACK_GUIDE_GRADIENTS[i % FALLBACK_GUIDE_GRADIENTS.length]!,
        }))
      : GUIDE_CARDS.map((g) => ({ ...g }));

  const ctaProduct = best[0];

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      <main>
        <HeroCarousel banners={banners} />

        {templates.length > 0 && (
          <section id="templates" className="bg-white py-10 sm:py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader
                title="2분컷, 이렇게 시작해 보세요"
                href="/templates"
                linkLabel="전체 보기"
              />
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                {templates.map((tpl) => (
                  <QuickTemplateCard key={tpl.id} tpl={tpl} />
                ))}
              </div>
            </div>
          </section>
        )}

        {ideas.length > 0 ? <IdeasSection ideas={ideas} /> : null}

        <section id="products" className="bg-white pb-10 pt-4 sm:pb-14 sm:pt-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 sm:justify-start sm:gap-x-5">
              {best.slice(0, 8).map((item) => (
                <ProductCard key={item.id} item={item} variant="circle" />
              ))}
            </div>
          </div>
        </section>

        <CasesSection cases={cases} />

        <section
          id="guides"
          className="bg-white py-10 sm:py-14"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            title="제작 가이드 & 활용 아이디어"
            subtitle="커스텀 전 꼭 알아두면 좋은 정보"
          />
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href={guide.href}
                className={`group flex min-w-[260px] shrink-0 flex-col justify-between rounded-2xl bg-gradient-to-br ${guide.gradient} p-6 lg:min-w-0`}
              >
                <div>
                  <h3 className="text-base font-bold leading-snug text-zinc-900 group-hover:text-rose-700">
                    {guide.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {guide.subtitle}
                  </p>
                </div>
                <span className="mt-4 text-xs font-semibold text-zinc-500 group-hover:text-zinc-800">
                  자세히 보기 →
                </span>
              </Link>
            ))}
          </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-14 text-center text-white sm:px-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl font-bold sm:text-4xl">
                지금 바로 나만의 굿즈를 만들어 보세요
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
                상품을 고르면 바로 디자인·주문까지 이어집니다.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={
                    ctaProduct
                      ? `/products/${ctaProduct.slug}`
                      : "/builder"
                  }
                  className="rounded-full bg-white px-10 py-3.5 text-sm font-bold text-zinc-900 shadow-lg hover:bg-zinc-100"
                >
                  상품 선택하고 시작
                </Link>
                <Link
                  href="/builder"
                  className="rounded-full border border-zinc-600 px-10 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  빌더 바로가기
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
