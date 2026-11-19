"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function ProductReviewForm({
  productSlug,
}: {
  productSlug: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <p className="text-sm text-zinc-500">
        리뷰 작성은{" "}
        <button
          type="button"
          className="font-semibold underline"
          onClick={() =>
            router.push(
              `/login?next=${encodeURIComponent(`/products/${productSlug}`)}`,
            )
          }
        >
          로그인
        </button>{" "}
        후 이용할 수 있습니다.
      </p>
    );
  }

  if (done) {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        리뷰가 등록되었습니다. 감사합니다!
      </p>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-900">리뷰 작성</p>
      <p className="mt-1 text-xs text-zinc-500">
        주문한 상품만 작성할 수 있습니다.
      </p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={`h-5 w-5 ${
                n <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-300"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="상품 후기를 남겨 주세요"
        className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        등록
      </button>
    </div>
  );
}
