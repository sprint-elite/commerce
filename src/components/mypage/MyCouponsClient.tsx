"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type CouponRow = {
  claimId: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
  endsAt: string | null;
};

export function MyCouponsClient({
  initialCoupons,
}: {
  initialCoupons: CouponRow[];
}) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const claim = async () => {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/me/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
      const list = await fetch("/api/me/coupons").then((r) => r.json());
      setCoupons(list.coupons ?? []);
      setCode("");
      setOk("쿠폰이 등록되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="쿠폰 코드 입력"
          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
        />
        <button
          type="button"
          disabled={busy || !code.trim()}
          onClick={() => void claim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          등록
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">{ok}</p>}

      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {coupons.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">
            등록된 쿠폰이 없습니다.
          </li>
        ) : (
          coupons.map((c) => (
            <li key={c.claimId} className="px-4 py-3">
              <p className="font-mono text-sm font-bold text-zinc-900">
                {c.code}
              </p>
              <p className="text-xs text-zinc-500">
                {c.name} ·{" "}
                {c.discountType === "PERCENT"
                  ? `${c.discountValue}%`
                  : `${c.discountValue.toLocaleString()}원`}{" "}
                할인
                {c.minOrderAmount > 0
                  ? ` · ${c.minOrderAmount.toLocaleString()}원 이상`
                  : ""}
              </p>
            </li>
          ))
        )}
      </ul>
      <p className="text-xs text-zinc-400">
        * 등록한 쿠폰은 마이페이지에서 확인할 수 있습니다.
      </p>
    </div>
  );
}
