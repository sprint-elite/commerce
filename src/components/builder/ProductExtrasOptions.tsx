"use client";

import { BAG_COLOR_PRESETS } from "@/lib/fabric/bag-colors";
import { useBuilderStore } from "@/store";
import type { BagColorOption } from "@/types/builder";
import { BAG_COLOR_LABELS } from "@/types/builder";
import { useBuilderProduct } from "./BuilderProductContext";

export function ProductExtrasOptions() {
  const product = useBuilderProduct();
  const schema = product?.optionSchema;
  const options = useBuilderStore((s) => s.options);
  const setOption = useBuilderStore((s) => s.setOption);

  if (!schema) return null;

  const strapColors = schema.handleStrapColors;

  if (!strapColors?.length) return null;

  const strapPresets = strapColors?.length
    ? BAG_COLOR_PRESETS.filter((p) =>
        strapColors.includes(p.id as BagColorOption),
      )
    : [];

  return (
    <div className="space-y-5">
      {strapPresets.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">
            손잡이 끈 색상 - {BAG_COLOR_LABELS[options.handleStrapColor]}
          </p>
          <div className="flex flex-wrap gap-2">
            {strapPresets.map((preset) => {
              const active = options.handleStrapColor === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.label}
                  onClick={() =>
                    setOption("handleStrapColor", preset.id as BagColorOption)
                  }
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${
                    active
                      ? "border-zinc-900 ring-2 ring-zinc-300 ring-offset-1"
                      : "border-zinc-200"
                  }`}
                  style={{ backgroundColor: preset.hex }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
