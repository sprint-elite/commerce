import Link from "next/link";
import type { User } from "@/types";

interface MyPageSummaryBarProps {
  user: User;
  orderCount: number;
  receivedCount: number;
  inProductionCount: number;
}

export function MyPageSummaryBar({
  user,
  orderCount,
  receivedCount,
  inProductionCount,
}: MyPageSummaryBarProps) {
  const stats = [
    { label: "전체 주문", value: `${orderCount}건` },
    { label: "접수 중", value: `${receivedCount}건` },
    { label: "제작 중", value: `${inProductionCount}건` },
  ];

  return (
    <section className="overflow-hidden rounded-2xl bg-zinc-900 text-white">
      <div className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
        <div>
          <p className="text-lg font-semibold sm:text-xl">
            반가워요, {user.name}님!
          </p>
          <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/mypage/profile"
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
            >
              내 정보 수정
            </Link>
            <Link
              href="/mypage/addresses"
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
            >
              배송지 관리
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-6 sm:gap-x-10">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-right">
              <p className="text-xs text-zinc-400">{stat.label}</p>
              <p className="mt-1 text-base font-bold tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
