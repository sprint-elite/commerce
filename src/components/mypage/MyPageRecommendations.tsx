import Link from "next/link";
import { Heart } from "lucide-react";
import type { CatalogProductDto } from "@/lib/catalog";
import { PRODUCT_GRADIENTS } from "@/lib/home-data";
import { ProductVisual } from "@/components/home/ProductVisual";

const PRODUCT_COLORS: Record<string, string> = {
  ecobag: "mint",
  "shopping-bag": "cream",
  pouch: "sky",
};

interface MyPageRecommendationsProps {
  products: CatalogProductDto[];
}

export function MyPageRecommendations({ products }: MyPageRecommendationsProps) {
  if (products.length === 0) return null;

  return (
    <section className="pt-2">
      <h2 className="mb-5 text-base font-bold text-zinc-900 sm:text-lg">
        이 아이템도 커스텀이 가능해요
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {products.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="group flex flex-col"
          >
            <div
              className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${PRODUCT_GRADIENTS[item.productType]}`}
            >
              <div className="flex h-full items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <ProductVisual
                  productType={item.productType}
                  color={PRODUCT_COLORS[item.slug] ?? "mint"}
                  size="md"
                />
              </div>
              <span
                aria-hidden
                className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-400 shadow-sm"
              >
                <Heart className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3 px-0.5">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900">
                {item.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
