"use client";

import { useBuilderStore } from "@/store";
import { useBuilderProduct } from "@/components/builder/BuilderProductContext";
import type { ViewSide } from "@/types/builder";
import {
  APPROVAL_STATUS_LABELS,
  FABRIC_LABELS,
  HANDLE_LABELS,
  POCKET_LABELS,
  PRINT_SIDE_LABELS,
  PRODUCT_TYPE_LABELS,
  getDesignViewSides,
  resolveSideLabel,
} from "@/types/builder";

interface PreviewPanelProps {
  onSideChange: (side: ViewSide) => void;
}

export function PreviewPanel({ onSideChange }: PreviewPanelProps) {
  const options = useBuilderStore((s) => s.options);
  const currentSide = useBuilderStore((s) => s.currentSide);
  const approvalStatus = useBuilderStore((s) => s.approvalStatus);
  const outOfBoundsWarning = useBuilderStore((s) => s.outOfBoundsWarning);
  const product = useBuilderProduct();
  const faces = product?.mockupFaces ?? [];
  const customSides = faces.length > 0 ? faces.map((f) => f.side) : null;
  const enabledSides = getDesignViewSides(
    options.productType,
    options.printSide,
    customSides,
  );

  return (
    <div className="space-y-2 text-xs">
      <div className="rounded border border-zinc-200 p-2">
        <p className="mb-1 font-semibold text-zinc-700">면 전환</p>
        <div className="flex flex-wrap gap-0.5">
          {enabledSides.map((side) => {
            const active = currentSide === side;
            return (
              <button
                key={side}
                type="button"
                onClick={() => onSideChange(side)}
                className={`min-w-[3.5rem] flex-1 rounded py-1 text-[11px] font-medium ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {resolveSideLabel(side, faces)}
              </button>
            );
          })}
        </div>
        {outOfBoundsWarning && (
          <p className="mt-1 text-[10px] text-amber-700">⚠ 인쇄영역 초과</p>
        )}
      </div>

      <div className="rounded border border-zinc-200 p-2">
        <dl className="space-y-0.5 text-[10px] text-zinc-500">
          <Row label="제품" value={PRODUCT_TYPE_LABELS[options.productType]} />
          <Row label="사이즈" value={options.size} />
          <Row label="원단" value={FABRIC_LABELS[options.fabric]} />
          <Row label="손잡이" value={HANDLE_LABELS[options.handle]} />
          <Row label="포켓" value={POCKET_LABELS[options.pocket]} />
          <Row label="인쇄" value={PRINT_SIDE_LABELS[options.printSide]} />
          <Row
            label="상태"
            value={APPROVAL_STATUS_LABELS[approvalStatus]}
          />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{label}</dt>
      <dd className="text-right text-zinc-700">{value}</dd>
    </div>
  );
}
