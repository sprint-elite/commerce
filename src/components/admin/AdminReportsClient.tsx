"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Report = {
  rangeDays: number;
  summary: {
    orderCount: number;
    grossRevenue: number;
    paidRevenue: number;
    unpaidAmount: number;
  };
  daily: Array<{ date: string; orders: number; revenue: number; paid: number }>;
  products: Array<{
    productId: string;
    name: string;
    slug: string;
    saleType: string;
    orders: number;
    revenue: number;
  }>;
};

export function AdminReportsClient() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/admin/reports?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [days]);

  if (loading || !data) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
      </div>
    );
  }

  const maxOrders = Math.max(1, ...data.daily.map((d) => d.orders));

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              days === d
                ? "bg-slate-900 text-white"
                : "bg-white ring-1 ring-slate-200"
            }`}
          >
            {d}일
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["주문 수", String(data.summary.orderCount)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold">일별 접수</h2>
        <div className="mt-4 flex h-40 items-end gap-1">
          {data.daily.map((d) => (
            <div
              key={d.date}
              className="flex flex-1 flex-col items-center justify-end"
              title={`${d.date}: ${d.orders}건`}
            >
              <div
                className="w-full rounded-t bg-slate-800"
                style={{ height: `${(d.orders / maxOrders) * 100}%`, minHeight: d.orders ? 4 : 0 }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b px-4 py-3 text-sm font-bold">상품별</h2>
        <ul className="divide-y">
          {data.products.map((p) => (
            <li
              key={p.productId}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.saleType} · {p.orders}건
                </p>
              </div>
              <p className="font-semibold">{p.orders}건</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
