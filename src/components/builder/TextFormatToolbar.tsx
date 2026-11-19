"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Redo2,
  Strikethrough,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react";
import type { DesignCanvasRef } from "./DesignCanvas";
import type { TextStyleState } from "@/types/text-style";
import {
  BUILDER_FONT_GROUPS,
  BUILDER_FONT_OPTIONS,
} from "@/types/text-style";
import {
  TEXT_LINE_HEIGHT_OPTIONS,
  TEXT_SIZE_OPTIONS,
} from "@/types/text-style";

interface TextFormatToolbarProps {
  canvasRef: React.RefObject<DesignCanvasRef | null>;
  style: TextStyleState;
  disabled?: boolean;
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-zinc-200" />;
}

export function TextFormatToolbar({
  canvasRef,
  style,
  disabled,
}: TextFormatToolbarProps) {
  const patch = (p: Partial<TextStyleState>) => {
    canvasRef.current?.updateTextStyle(p);
  };

  const toggleBtn = (
    active: boolean,
    label: string,
    onClick: () => void,
    icon: React.ReactNode,
  ) => (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors disabled:opacity-30 ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <>
      <select
        disabled={disabled}
        value={style.fontFamily}
        onChange={(e) => patch({ fontFamily: e.target.value })}
        className="h-8 max-w-[148px] shrink-0 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-zinc-400 disabled:opacity-30"
        title="글꼴"
      >
        {BUILDER_FONT_GROUPS.map((group) => {
          const fonts = BUILDER_FONT_OPTIONS.filter((f) => f.group === group.id);
          if (fonts.length === 0) return null;
          return (
            <optgroup key={group.id} label={group.label}>
              {fonts.map((f) => (
                <option
                  key={f.value}
                  value={f.value}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>

      <select
        disabled={disabled}
        value={style.fontSize}
        onChange={(e) => patch({ fontSize: Number(e.target.value) })}
        className="h-8 w-[68px] shrink-0 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-zinc-400 disabled:opacity-30"
        title="글자 크기"
      >
        {TEXT_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <ToolbarDivider />

      {toggleBtn(
        style.fontWeight === "bold",
        "굵게",
        () => patch({ fontWeight: style.fontWeight === "bold" ? "normal" : "bold" }),
        <Bold className="h-4 w-4" strokeWidth={2} />,
      )}
      {toggleBtn(
        style.fontStyle === "italic",
        "기울임",
        () => patch({ fontStyle: style.fontStyle === "italic" ? "normal" : "italic" }),
        <Italic className="h-4 w-4" strokeWidth={2} />,
      )}
      {toggleBtn(
        style.underline,
        "밑줄",
        () => patch({ underline: !style.underline }),
        <Underline className="h-4 w-4" strokeWidth={2} />,
      )}
      {toggleBtn(
        style.linethrough,
        "취소선",
        () => patch({ linethrough: !style.linethrough }),
        <Strikethrough className="h-4 w-4" strokeWidth={2} />,
      )}

      <ToolbarDivider />

      {toggleBtn(
        style.textAlign === "left",
        "왼쪽 정렬",
        () => patch({ textAlign: "left" }),
        <AlignLeft className="h-4 w-4" strokeWidth={2} />,
      )}
      {toggleBtn(
        style.textAlign === "center",
        "가운데 정렬",
        () => patch({ textAlign: "center" }),
        <AlignCenter className="h-4 w-4" strokeWidth={2} />,
      )}
      {toggleBtn(
        style.textAlign === "right",
        "오른쪽 정렬",
        () => patch({ textAlign: "right" }),
        <AlignRight className="h-4 w-4" strokeWidth={2} />,
      )}
      {toggleBtn(
        style.textAlign === "justify",
        "양쪽 정렬",
        () => patch({ textAlign: "justify" }),
        <AlignJustify className="h-4 w-4" strokeWidth={2} />,
      )}

      <ToolbarDivider />

      <label
        title="글자 색상"
        className="relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-zinc-200 bg-white px-2 disabled:opacity-30"
      >
        <input
          type="color"
          disabled={disabled}
          value={style.fill.startsWith("#") ? style.fill : "#18181b"}
          onChange={(e) => patch({ fill: e.target.value })}
          className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
        />
        <span className="text-[10px] font-medium uppercase text-zinc-500">
          색상
        </span>
      </label>

      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] text-zinc-400">행간</span>
        <select
          disabled={disabled}
          value={style.lineHeight}
          onChange={(e) => patch({ lineHeight: Number(e.target.value) })}
          className="h-8 w-14 rounded border border-zinc-200 bg-white px-1 text-xs text-zinc-800 outline-none focus:border-zinc-400 disabled:opacity-30"
          title="줄 간격"
        >
          {TEXT_LINE_HEIGHT_OPTIONS.map((lh) => (
            <option key={lh} value={lh}>
              {lh}
            </option>
          ))}
        </select>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px] text-zinc-400">자간</span>
        <input
          type="number"
          disabled={disabled}
          min={-100}
          max={400}
          step={10}
          value={style.charSpacing}
          onChange={(e) => patch({ charSpacing: Number(e.target.value) })}
          className="h-8 w-14 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-zinc-400 disabled:opacity-30"
          title="자간"
        />
      </div>

      <ToolbarDivider />

      <button
        type="button"
        disabled={disabled}
        title="실행 취소"
        onClick={() => canvasRef.current?.undo()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <Undo2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        disabled={disabled}
        title="다시 실행"
        onClick={() => canvasRef.current?.redo()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <Redo2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        disabled={disabled}
        title="삭제"
        onClick={() => canvasRef.current?.deleteSelected()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </>
  );
}
