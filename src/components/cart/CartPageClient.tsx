"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import type { CartSummary } from "@/lib/cart";

interface CartPageClientProps {
  initialCart: CartSummary;
}

export function CartPageClient({ initialCart }: CartPageClientProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = (next: CartSummary) => setCart(next);

  const updateQty = async (id: string, quantity: number) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = (await res.json()) as { cart?: CartSummary; error?: string };
      if (!res.ok) throw new Error(data.error ?? "수량 변경 실패");
      if (data.cart) refresh(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수량 변경 실패");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { cart?: CartSummary; error?: string };
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      if (data.cart) refresh(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusyId(null);
    }
  };

  const checkout = async () => {
    setCheckingOut(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/from-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingName: "",
          shippingPhone: "",
          shippingAddress: "",
          notes: "",
        }),
      });
      const data = (await res.json()) as {
        order?: { id: string };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "주문 실패");
      if (data.order?.id) {
        router.push(`/mypage/orders/${data.order.id}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 실패");
      setCheckingOut(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">장바구니</h1>
        <p className="mt-3 text-sm text-zinc-500">담은 상품이 없습니다.</p>
        <Link
          href="/products/list"
          className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          상품 보러가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">장바구니</h1>
        <p className="mt-1 text-sm text-zinc-500">
          기성품 {cart.itemCount}개
        </p>
      </div>

      <ul className="space-y-3">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.productSlug}`}
                className="text-sm font-semibold text-zinc-900 hover:underline"
              >
                {item.productName}
              </Link>
              <p className="mt-1 text-sm text-zinc-600">{item.quantity}개</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-lg border border-zinc-200">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    className="p-2 text-zinc-600"
                    onClick={() =>
                      void updateQty(item.id, Math.max(1, item.quantity - 1))
                    }
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    className="p-2 text-zinc-600"
                    onClick={() => void updateQty(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void remove(item.id)}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm">
        <button
          type="button"
          disabled={checkingOut}
          onClick={() => void checkout()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          주문 접수
        </button>
      </section>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
