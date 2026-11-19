"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useSiteInfo } from "@/components/site/SiteInfoProvider";
import { SHOW_HOME_REVIEWS_SECTION } from "@/lib/home-data";
import { PRODUCT_PAGE_CONTAINER } from "@/lib/product-layout";

/** 클라이언트 — 루트 레이아웃의 SiteInfoProvider(관리자 설정 DB) 값 사용 */
export function HomeFooter({ wide = false }: { wide?: boolean }) {
  const info = useSiteInfo();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div
        className={`py-12 ${wide ? PRODUCT_PAGE_CONTAINER : "mx-auto max-w-7xl px-4 sm:px-6"}`}
      >
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-black text-zinc-900"
            >
              <ShoppingBag className="h-5 w-5" />
              {info.brandName}
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
              나만의 커스텀 굿즈를 디자인하고 주문부터 제작 관리까지 한곳에서.
              에코백, 장바구니, 파우치 1개부터 제작 가능합니다.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-zinc-900">About</p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li>
                <Link href="/#products" className="hover:text-zinc-900">
                  상품
                </Link>
              </li>
              <li>
                <Link href="/builder" className="hover:text-zinc-900">
                  만들기
                </Link>
              </li>
              {SHOW_HOME_REVIEWS_SECTION ? (
                <li>
                  <Link href="/#reviews" className="hover:text-zinc-900">
                    리뷰
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-zinc-900">Support</p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li>
                <Link href="/faq" className="hover:text-zinc-900">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/inquiry" className="hover:text-zinc-900">
                  1:1 문의
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-zinc-900">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li>
                <Link href="/terms" className="hover:text-zinc-900">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-900">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-1 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-400">
          <p>
            {info.companyName} · 대표 {info.ceoName} · 사업자등록번호{" "}
            {info.businessNumber}
          </p>
          <p>{info.address}</p>
          <p>
            {info.email}
            {info.hours ? ` · ${info.hours}` : null}
          </p>
          <p className="pt-2">
            © {new Date().getFullYear()} {info.brandName}
          </p>
        </div>
      </div>
    </footer>
  );
}
