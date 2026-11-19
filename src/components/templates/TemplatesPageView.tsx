import Image from "next/image";
import Link from "next/link";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { PRODUCT_DISPLAY_IMAGES } from "@/lib/home-data";
import type { TemplateProductCard } from "@/lib/template-collections";

export type TemplateGridCard = {
  id: string;
  ideaSlug: string;
  title: string;
  subtitle: string;
  coverImageUrl: string;
  products: TemplateProductCard[];
};

export function TemplatesPageView({
  collections,
}: {
  collections: TemplateGridCard[];
}) {
  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      <main>
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
          <h1 className="sr-only">2분컷 템플릿</h1>

          {/* 마플형: 큰 소개(상황별 굿즈) + 아래 소형 상품 3개 */}
          <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14">
            {collections.map((col) => (
              <article key={col.id} className="flex flex-col">
                <Link
                  href={`/ideas/${col.ideaSlug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100">
                    <Image
                      src={col.coverImageUrl}
                      alt={col.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h2 className="mt-4 text-[17px] font-bold leading-snug text-zinc-900 group-hover:text-rose-600 sm:text-lg">
                    {col.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                    {col.subtitle}
                  </p>
                </Link>

                <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
                  {col.products.map((p) => {
                    const img =
                      PRODUCT_DISPLAY_IMAGES[p.productType] ?? null;
                    return (
                      <li key={`${col.id}-${p.slug}`}>
                        <Link
                          href={`/products/${p.slug}`}
                          className="group/item flex flex-col"
                        >
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-50">
                            {img ? (
                              <Image
                                src={img}
                                alt={p.caption ?? p.name}
                                fill
                                className="object-contain p-2.5 transition duration-300 group-hover/item:scale-105"
                                sizes="120px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-zinc-400">
                                {p.name}
                              </div>
                            )}
                          </div>
                          <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-snug text-zinc-800 sm:text-[13px]">
                            {p.caption ?? p.name}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
