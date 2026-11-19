"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  AdminImageUploadField,
  uploadAdminImage,
} from "./AdminImageUploadField";

type Section = {
  type: string;
  title: string;
  body: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};
type ImageRow = {
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
};
type Discount = {
  minQuantity: string;
  unitPrice: string;
  discountRate: string;
  label: string;
};

const SECTION_TYPES = [
  "STORY",
  "INFO",
  "GUIDE",
  "SIZE",
  "FAQ",
  "SHIPPING",
  "CAUTION",
];

export function AdminProductContentEditor({
  productId,
  productName,
  embedded = false,
}: {
  productId: string;
  productName: string;
  embedded?: boolean;
}) {
  const [sections, setSections] = useState<Section[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [stockQuantity, setStockQuantity] = useState("");
  const [saleType, setSaleType] = useState("CUSTOM");
  const [noticeItems, setNoticeItems] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/admin/products/${productId}/content`);
      const data = await res.json();
      setSaleType(data.product?.saleType ?? "CUSTOM");
      setStockQuantity(
        data.product?.stockQuantity != null
          ? String(data.product.stockQuantity)
          : "",
      );
      setNoticeItems(
        Array.isArray(data.product?.noticeItems) &&
          data.product.noticeItems.length > 0
          ? data.product.noticeItems
          : [
              { label: "제품 소재", value: "" },
              { label: "색상", value: "" },
              { label: "치수", value: "" },
              { label: "제조자", value: "" },
              { label: "제조국", value: "대한민국" },
              { label: "취급방법", value: "" },
              {
                label: "품질보증기준",
                value: "관련 법 및 소비자분쟁해결기준에 따름",
              },
              { label: "A/S 책임자·연락처", value: "" },
            ],
      );
      setSections(
        (data.sections ?? []).map(
          (s: {
            type: string;
            title: string;
            body: string;
            imageUrl: string | null;
            sortOrder: number;
            isActive: boolean;
          }) => ({
            type: s.type,
            title: s.title,
            body: s.body,
            imageUrl: s.imageUrl ?? "",
            sortOrder: s.sortOrder,
            isActive: s.isActive,
          }),
        ),
      );
      setImages(
        (data.images ?? []).map(
          (i: {
            url: string;
            alt: string | null;
            sortOrder: number;
            isPrimary: boolean;
          }) => ({
            url: i.url,
            alt: i.alt ?? "",
            sortOrder: i.sortOrder,
            isPrimary: i.isPrimary,
          }),
        ),
      );
      setDiscounts(
        (data.discounts ?? []).map(
          (d: {
            minQuantity: number;
            unitPrice: number | null;
            discountRate: number | null;
            label: string | null;
          }) => ({
            minQuantity: String(d.minQuantity),
            unitPrice: d.unitPrice != null ? String(d.unitPrice) : "",
            discountRate: d.discountRate != null ? String(d.discountRate) : "",
            label: d.label ?? "",
          }),
        ),
      );
      setLoading(false);
    })();
  }, [productId]);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockQuantity: stockQuantity.trim() === "" ? null : Number(stockQuantity),
          noticeItems,
          sections: sections.map((s, i) => ({ ...s, sortOrder: i })),
          images: images.map((img, i) => ({ ...img, sortOrder: i })),
          discounts: discounts.map((d, i) => ({
            minQuantity: Number(d.minQuantity),
            unitPrice: d.unitPrice ? Number(d.unitPrice) : null,
            discountRate: d.discountRate ? Number(d.discountRate) : null,
            label: d.label || null,
            sortOrder: i,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "저장 실패");
      }
      setMsg("저장되었습니다.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/products" className="text-xs text-slate-500">
              ← 상품 목록
            </Link>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              {productName} · 콘텐츠
            </h1>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            저장
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            상세 섹션 · 갤러리 · 수량할인
            {saleType === "READYMADE" ? " · 재고" : ""}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            상세 저장
          </button>
        </div>
      )}
      {msg && <p className="text-sm text-slate-600">{msg}</p>}

      <section className="border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">
          {saleType === "READYMADE" ? "재고 · 상품정보제공고시" : "상품정보제공고시"}
        </h2>
        {saleType === "READYMADE" && (
          <label className="mt-4 block max-w-xs text-sm">
            <span className="text-xs font-medium text-slate-500">
              재고 수량 (비우면 무제한)
            </span>
            <input
              type="number"
              min={0}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              기성품만 재고를 차감합니다. 0이면 품절 표시됩니다.
            </span>
          </label>
        )}
        <div className="mt-4 space-y-2">
          {noticeItems.map((n, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-2">
              <input
                value={n.label}
                onChange={(e) =>
                  setNoticeItems((prev) =>
                    prev.map((row, i) =>
                      i === idx ? { ...row, label: e.target.value } : row,
                    ),
                  )
                }
                placeholder="항목"
                className="border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={n.value}
                onChange={(e) =>
                  setNoticeItems((prev) =>
                    prev.map((row, i) =>
                      i === idx ? { ...row, value: e.target.value } : row,
                    ),
                  )
                }
                placeholder="내용"
                className="border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setNoticeItems((prev) => [...prev, { label: "", value: "" }])
            }
            className="text-xs font-semibold text-slate-600"
          >
            + 고시 항목 추가
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">상세 섹션</h2>
          <button
            type="button"
            onClick={() =>
              setSections((s) => [
                ...s,
                {
                  type: "INFO",
                  title: "",
                  body: "",
                  imageUrl: "",
                  sortOrder: s.length,
                  isActive: true,
                },
              ])
            }
            className="inline-flex items-center gap-1 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> 추가
          </button>
        </div>
        <ul className="mt-3 space-y-3">
          {sections.map((s, idx) => (
            <li key={idx} className="rounded-xl border p-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={s.type}
                  onChange={(e) =>
                    setSections((rows) =>
                      rows.map((r, i) =>
                        i === idx ? { ...r, type: e.target.value } : r,
                      ),
                    )
                  }
                  className="rounded-lg border px-2 py-1.5 text-sm"
                >
                  {SECTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSections((rows) => rows.filter((_, i) => i !== idx))
                  }
                  className="ml-auto text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={s.title}
                placeholder="제목"
                onChange={(e) =>
                  setSections((rows) =>
                    rows.map((r, i) =>
                      i === idx ? { ...r, title: e.target.value } : r,
                    ),
                  )
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <textarea
                value={s.body}
                placeholder="본문"
                rows={3}
                onChange={(e) =>
                  setSections((rows) =>
                    rows.map((r, i) =>
                      i === idx ? { ...r, body: e.target.value } : r,
                    ),
                  )
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <AdminImageUploadField
                label="섹션 이미지"
                value={s.imageUrl}
                onChange={(imageUrl) =>
                  setSections((rows) =>
                    rows.map((r, i) =>
                      i === idx ? { ...r, imageUrl } : r,
                    ),
                  )
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">갤러리 이미지</h2>
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold">
            <Plus className="h-3.5 w-3.5" /> 추가
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (files.length === 0) return;
                void (async () => {
                  setMsg(null);
                  setBusy(true);
                  try {
                    const urls: string[] = [];
                    for (const file of files) {
                      urls.push(await uploadAdminImage(file));
                    }
                    setImages((imgs) => [
                      ...imgs,
                      ...urls.map((url, i) => ({
                        url,
                        alt: "",
                        sortOrder: imgs.length + i,
                        isPrimary: imgs.length === 0 && i === 0,
                      })),
                    ]);
                  } catch (err) {
                    setMsg(
                      err instanceof Error ? err.message : "업로드 실패",
                    );
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            />
          </label>
        </div>
        <ul className="mt-3 space-y-3">
          {images.map((img, idx) => (
            <li key={`${img.url}-${idx}`} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <AdminImageUploadField
                  value={img.url}
                  allowClear={false}
                  onChange={(url) =>
                    setImages((rows) =>
                      rows.map((r, i) => (i === idx ? { ...r, url } : r)),
                    )
                  }
                />
              </div>
              <label className="flex shrink-0 items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={img.isPrimary}
                  onChange={(e) =>
                    setImages((rows) =>
                      rows.map((r, i) => ({
                        ...r,
                        isPrimary: i === idx ? e.target.checked : false,
                      })),
                    )
                  }
                />
                대표
              </label>
              <button
                type="button"
                onClick={() =>
                  setImages((rows) => rows.filter((_, i) => i !== idx))
                }
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4 text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">수량 할인</h2>
          <button
            type="button"
            onClick={() =>
              setDiscounts((d) => [
                ...d,
                {
                  minQuantity: "100",
                  unitPrice: "",
                  discountRate: "0.05",
                  label: "",
                },
              ])
            }
            className="inline-flex items-center gap-1 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> 추가
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {discounts.map((d, idx) => (
            <li key={idx} className="grid gap-2 sm:grid-cols-4">
              <input
                value={d.minQuantity}
                placeholder="최소수량"
                onChange={(e) =>
                  setDiscounts((rows) =>
                    rows.map((r, i) =>
                      i === idx ? { ...r, minQuantity: e.target.value } : r,
                    ),
                  )
                }
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <input
                value={d.unitPrice}
                placeholder="단가(원)"
                onChange={(e) =>
                  setDiscounts((rows) =>
                    rows.map((r, i) =>
                      i === idx ? { ...r, unitPrice: e.target.value } : r,
                    ),
                  )
                }
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <input
                value={d.discountRate}
                placeholder="할인율 0.05"
                onChange={(e) =>
                  setDiscounts((rows) =>
                    rows.map((r, i) =>
                      i === idx ? { ...r, discountRate: e.target.value } : r,
                    ),
                  )
                }
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <input
                  value={d.label}
                  placeholder="라벨"
                  onChange={(e) =>
                    setDiscounts((rows) =>
                      rows.map((r, i) =>
                        i === idx ? { ...r, label: e.target.value } : r,
                      ),
                    )
                  }
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDiscounts((rows) => rows.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
