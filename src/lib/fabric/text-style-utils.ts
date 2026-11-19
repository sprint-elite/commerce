import type { FabricObject } from "fabric";
import type { TextAlignOption, TextStyleState } from "@/types/text-style";
import { DEFAULT_BUILDER_FONT } from "@/lib/builder-fonts";

type TextLike = FabricObject & {
  fontFamily?: string;
  fontSize?: number;
  fill?: string | unknown;
  textAlign?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  underline?: boolean;
  linethrough?: boolean;
  lineHeight?: number;
  charSpacing?: number;
};

export function isTextObject(obj: FabricObject): boolean {
  const t = obj.type ?? "";
  return t === "i-text" || t === "text" || t === "textbox";
}

export function normalizeFontFamily(fontFamily?: string): string {
  if (!fontFamily) return DEFAULT_BUILDER_FONT;
  return fontFamily.split(",")[0]?.replace(/['"]/g, "").trim()
    ? fontFamily
    : DEFAULT_BUILDER_FONT;
}

function isBold(fontWeight?: string | number): boolean {
  return fontWeight === "bold" || fontWeight === 700 || fontWeight === "700";
}

function normalizeFill(fill: unknown): string {
  if (typeof fill === "string") return fill;
  return "#18181b";
}

function normalizeTextAlign(value?: string): TextAlignOption {
  if (value === "center" || value === "right" || value === "justify") return value;
  return "left";
}

export function readTextStyle(obj: TextLike): TextStyleState {
  return {
    fontFamily: normalizeFontFamily(obj.fontFamily),
    fontSize: obj.fontSize ?? 28,
    fill: normalizeFill(obj.fill),
    textAlign: normalizeTextAlign(obj.textAlign),
    fontWeight: isBold(obj.fontWeight) ? "bold" : "normal",
    fontStyle: obj.fontStyle === "italic" ? "italic" : "normal",
    underline: !!obj.underline,
    linethrough: !!obj.linethrough,
    lineHeight: obj.lineHeight ?? 1.16,
    charSpacing: obj.charSpacing ?? 0,
  };
}

export function applyTextStylePatch(
  obj: TextLike,
  patch: Partial<TextStyleState>,
): void {
  const next: Record<string, unknown> = { ...patch };
  if (patch.fontWeight) next.fontWeight = patch.fontWeight;
  if (patch.fontStyle) next.fontStyle = patch.fontStyle;
  obj.set(next);
}
