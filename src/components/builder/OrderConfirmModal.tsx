"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getProductTitle } from "@/lib/fabric/mockup-builder";
import type { OrderShippingInput } from "@/lib/order-shipping";
import {
  BAG_COLOR_LABELS,
  HANDLE_LABELS,
  POCKET_LABELS,
  PRINT_SIDE_LABELS,
  SIZE_LABELS,
} from "@/types/builder";
import type { BuilderOptions } from "@/types/builder";

export type OrderConfirmMode = "create" | "update";

export type OrderConfirmData = {
  title: string;
  options: BuilderOptions;
  unitPrice: number;
  totalPrice: number;
  mode?: OrderConfirmMode;
  orderNumber?: string;
  initialShipping?: Partial<OrderShippingInput>;
};

interface OrderConfirmModalProps {
  open: boolean;
  data: OrderConfirmData | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (shipping: OrderShippingInput) => void | Promise<void>;
}

export function OrderConfirmModal({
  open,
  data,
  submitting,
  onClose,
  onConfirm,
}: OrderConfirmModalProps) {
  const [notes, setNotes] = useState("");

  const isUpdate = data?.mode === "update";

  useEffect(() => {
    if (open && data) {
      setNotes(data.initialShipping?.notes ?? "");
    }
  }, [open, data]);

  if (!open || !data) return null;

  const title = data.title || getProductTitle(data.options);

  const handleClose = () => {
    if (submitting) return;
    setNotes("");
    onClose();
  };

  const handleSubmit = () => {
    void onConfirm({
      shippingName: "",
      shippingPhone: "",
      shippingAddress: "",
      shippingZip: "",
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-900">
            {isUpdate ? "주문 수정 확인" : "주문 정보 확인"}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {isUpdate && data.orderNumber && (
            <p className="rounded-lg bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-700">
              {data.orderNumber}
            </p>
          )}
          <div>
            <p className="text-xs text-zinc-400">상품</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900">{title}</p>
          </div>

          <div className="space-y-2 rounded-lg bg-zinc-50 px-4 py-3 text-sm">
            <SummaryRow label="사이즈" value={SIZE_LABELS[data.options.size]} />
            <SummaryRow
              label="본체 색상"
              value={BAG_COLOR_LABELS[data.options.bagColor]}
            />
            {data.options.productType === "ecobag" && (
              <>
                <SummaryRow
                  label="손잡이 끈 색상"
                  value={BAG_COLOR_LABELS[data.options.handleStrapColor]}
                />
              </>
            )}
            <SummaryRow label="손잡이" value={HANDLE_LABELS[data.options.handle]} />
            <SummaryRow label="포켓" value={POCKET_LABELS[data.options.pocket]} />
            <SummaryRow
              label="인쇄면"
              value={PRINT_SIDE_LABELS[data.options.printSide]}
            />
            <SummaryRow label="수량" value={`${data.options.quantity}개`} />
          </div>

          <div className="space-y-2 border-t border-zinc-100 pt-4">
            <label className="block text-sm font-semibold text-zinc-900">
              요청사항
              <textarea
                value={notes}
                disabled={submitting}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="제작 시 전달할 내용이 있으면 적어 주세요"
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal outline-none focus:border-zinc-400"
              />
            </label>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting
              ? isUpdate
                ? "저장 중…"
                : "주문 처리 중…"
              : isUpdate
                ? "수정 저장"
                : "주문 확정"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-800">{value}</span>
    </div>
  );
}
