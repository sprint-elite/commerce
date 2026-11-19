"use client";

import { Star } from "lucide-react";
import { getProductTitle } from "@/lib/fabric/mockup-builder";
import { useBuilderStore } from "@/store";
import {
  HANDLE_LABELS,
  POCKET_LABELS,
  PRINT_SIDE_LABELS,
  SIZE_LABELS,
  type SizeOption,
} from "@/types/builder";
import { useBuilderProduct } from "./BuilderProductContext";
import { ProductExtrasOptions } from "./ProductExtrasOptions";
import { ProductOptionPanel } from "./ProductOptionPanel";
import { BagColorPicker } from "./BagColorPicker";

interface OrderPanelProps {
  onOrder?: () => void | Promise<void>;
  onUpdate?: () => void | Promise<void>;
  ordering?: boolean;
  loadedOrderNumber?: string;
  /** 상품 상세 임베드: 원단·손잡이·포켓·인쇄면 옵션 숨김 */
  compact?: boolean;
  /** 관리자 수정 모드: 신규 주문 버튼 숨김 */
  adminEdit?: boolean;
}

const ALL_SIZES: SizeOption[] = ["S", "M", "L"];

export function OrderPanel({
  onOrder,
  onUpdate,
  ordering,
  loadedOrderNumber,
  compact = false,
  adminEdit = false,
}: OrderPanelProps) {
  const product = useBuilderProduct();
  const options = useBuilderStore((s) => s.options);
  const setOption = useBuilderStore((s) => s.setOption);

  const sizeOptions = product?.optionSchema?.sizes ?? ALL_SIZES;

  const displayTitle = product?.name ?? getProductTitle(options);
  const sizeLabel = SIZE_LABELS[options.size]?.split(" ")[0] ?? options.size;
  const ratingDisplay =
    product && product.ratingAvg > 0
      ? product.ratingAvg.toFixed(1)
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-100 px-5 py-5">
        {product?.categoryName && (
          <p className="text-xs text-zinc-400">{product.categoryName}</p>
        )}
        <h2 className="mt-1 text-lg font-bold text-zinc-900">{displayTitle}</h2>
        {product?.shortDesc && (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {product.shortDesc}
          </p>
        )}
        {ratingDisplay && product && (
          <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(product.ratingAvg)
                      ? "fill-current"
                      : "fill-zinc-200 text-zinc-200"
                  }`}
                />
              ))}
            </div>
            <span>
              {ratingDisplay}
              {product.reviewCount > 0 &&
                ` (${product.reviewCount.toLocaleString("ko-KR")})`}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <BagColorPicker />

        <ProductExtrasOptions />

        {sizeOptions.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-zinc-800">사이즈</p>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOption("size", s)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    options.size === s
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {SIZE_LABELS[s]?.split(" ")[0] ?? s}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-zinc-400">
              선택: {sizeLabel}
            </p>
          </div>
        )}

        {!compact && <ProductOptionPanel />}

        <Field label="수량" labelClassName="text-zinc-900">
          <div className="flex h-10 w-full max-w-[220px] items-stretch overflow-hidden rounded-full border border-zinc-300 bg-white">
            <button
              type="button"
              className="flex w-11 shrink-0 items-center justify-center text-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
              onClick={() =>
                setOption(
                  "quantity",
                  Math.max(product?.minQuantity ?? 1, options.quantity - 1),
                )
              }
              aria-label="수량 줄이기"
            >
              −
            </button>
            <input
              type="number"
              min={product?.minQuantity ?? 1}
              max={product?.maxQuantity ?? 9999}
              value={options.quantity}
              onChange={(e) => {
                const min = product?.minQuantity ?? 1;
                const max = product?.maxQuantity ?? 9999;
                const next = Math.max(
                  min,
                  Math.min(max, Number(e.target.value) || min),
                );
                setOption("quantity", next);
              }}
              className="min-w-0 flex-1 border-x border-zinc-300 bg-white text-center text-sm font-medium text-zinc-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              className="flex w-11 shrink-0 items-center justify-center text-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
              onClick={() =>
                setOption(
                  "quantity",
                  Math.min(
                    product?.maxQuantity ?? 9999,
                    options.quantity + 1,
                  ),
                )
              }
              aria-label="수량 늘리기"
            >
              +
            </button>
          </div>
        </Field>

        {!compact && (
          <>
            <SummaryRow label="손잡이" value={HANDLE_LABELS[options.handle]} />
            <SummaryRow label="포켓" value={POCKET_LABELS[options.pocket]} />
            <SummaryRow
              label="인쇄면"
              value={PRINT_SIDE_LABELS[options.printSide]}
            />
          </>
        )}
      </div>

      <div className="border-t border-zinc-100 bg-white p-5">
        {loadedOrderNumber && (
          <p className="mb-3 rounded-lg bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-600">
            불러온 주문{" "}
            <span className="font-mono font-semibold text-zinc-900">
              {loadedOrderNumber}
            </span>
          </p>
        )}
        <div className="flex gap-2">
          {loadedOrderNumber && (
            <button
              type="button"
              disabled={ordering || !onUpdate}
              onClick={() => void onUpdate?.()}
              className={`rounded-xl border border-zinc-900 py-3.5 text-sm font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 ${
                adminEdit ? "w-full" : "flex-1"
              }`}
            >
              {ordering ? "처리 중…" : adminEdit ? "수정 저장" : "수정하기"}
            </button>
          )}
          {!adminEdit && (
            <button
              type="button"
              disabled={ordering || !onOrder}
              onClick={() => void onOrder?.()}
              className={`rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-50 ${
                loadedOrderNumber ? "flex-1" : "w-full"
              }`}
            >
              {ordering ? "처리 중…" : "주문하기"}
            </button>
          )}
        </div>
        {adminEdit && (
          <p className="mt-2 text-center text-[10px] text-slate-500">
            저장 후 관리자 주문 상세로 돌아갑니다
          </p>
        )}
        {!adminEdit && (
          <p className="mt-2 text-center text-[10px] text-zinc-400">
            PNG·JPG 2500px 이상 권장
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  labelClassName,
  children,
}: {
  label: string;
  labelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className={`mb-1.5 text-sm font-semibold ${labelClassName ?? "text-zinc-800"}`}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-800">{value}</span>
    </div>
  );
}
