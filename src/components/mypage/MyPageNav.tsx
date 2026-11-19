"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/mypage", label: "주문 내역", match: (p: string) => p === "/mypage" || p.startsWith("/mypage/orders") },
  { href: "/mypage/wishlist", label: "찜", match: (p: string) => p.startsWith("/mypage/wishlist") },
  { href: "/mypage/coupons", label: "쿠폰", match: (p: string) => p.startsWith("/mypage/coupons") },
  { href: "/mypage/returns", label: "교환·반품", match: (p: string) => p.startsWith("/mypage/returns") },
  {
    href: "/mypage/addresses",
    label: "배송지",
    match: (p: string) => p.startsWith("/mypage/addresses"),
  },
  { href: "/inquiry", label: "1:1 문의", match: (p: string) => p.startsWith("/inquiry") },
  { href: "/mypage/profile", label: "내 정보", match: (p: string) => p.startsWith("/mypage/profile") },
] as const;

export function MyPageNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5 border-b border-zinc-200 pb-4">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
