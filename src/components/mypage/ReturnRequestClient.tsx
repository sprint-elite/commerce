"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { isReturnEligibleOrderStatus } from "@/lib/returns";

type OrderOpt = { id: string; orderNumber: string; productName: string };
type ReturnRow = {
  id: string;
  type: string;
  reason: string;
  status: string;
  orderNumber: string;
  productName: string;
  createdAt: string;
};

const STATUS: Record<string, string> = {
  PENDING: "접수",
  APPROVED: "승인",
  REJECTED: "거절",
  DONE: "완료",
};

export function ReturnRequestClient() {
  const [orders, setOrders] = useState<OrderOpt[]>([]);
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState("RETURN");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [oRes, rRes] = await Promise.all([
      fetch("/api/orders"),
      fetch("/api/returns"),
    ]);
    const oData = (await oRes.json()) as {
      orders?: Array<{
        id: string;
        orderNumber: string;
        productName: string;
        paymentStatus: string;
        status: string;
      }>;
    };
    const rData = (await rRes.json()) as { returns?: ReturnRow[] };
    setOrders(
      (oData.orders ?? [])
        .filter(
          (o) =>
            isReturnEligibleOrderStatus(o.status),
        )
        .map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          productName: o.productName,
        })),
    );
    setRows(rData.returns ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, type, reason }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "신청 실패");
      setMsg("신청이 접수되었습니다.");
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "신청 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">교환 · 반품 신청</h1>
        <p className="mt-2 text-sm text-zinc-500">
          제작·배송이 진행된 주문만 신청할 수 있습니다. 안내 정책은{" "}
          <Link href="/returns" className="font-medium text-zinc-800 underline">
            교환·반품 안내
          </Link>
          를 확인해 주세요.
        </p>
      </div>

      <form
        onSubmit={(e) => void submit(e)}
        className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
      >
        <select
          required
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        >
          <option value="">주문 선택</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.orderNumber} · {o.productName}
            </option>
          ))}
        </select>
        {orders.length === 0 ? (
          <p className="text-xs text-zinc-500">
            신청 가능한 주문이 없습니다. (접수만 된 주문은 제외)
          </p>
        ) : null}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        >
          <option value="RETURN">반품</option>
          <option value="EXCHANGE">교환</option>
        </select>
        <textarea
          required
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="사유 (5자 이상)"
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        <button
          type="submit"
          disabled={busy || orders.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          신청하기
        </button>
      </form>

      <section>
        <h2 className="text-sm font-bold text-zinc-900">내 신청 내역</h2>
        <ul className="mt-3 divide-y rounded-2xl border border-zinc-200 bg-white">
          {rows.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              신청 내역이 없습니다.
            </li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium text-zinc-900">
                    {r.type === "EXCHANGE" ? "교환" : "반품"} · {r.orderNumber}
                  </p>
                  <span className="text-xs font-semibold text-zinc-500">
                    {STATUS[r.status] ?? r.status}
                  </span>
                </div>
                <p className="mt-1 text-zinc-600">{r.reason}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
