import type { ImageStyleState } from "./image-style";
import {
  BUILDER_FONT_OPTIONS,
  BUILDER_FONT_GROUPS,
  DEFAULT_BUILDER_FONT,
} from "@/lib/builder-fonts";

export type TextAlignOption = "left" | "center" | "right" | "justify";

export type TextStyleState = {
  fontFamily: string;
  fontSize: number;
  fill: string;
  textAlign: TextAlignOption;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  underline: boolean;
  linethrough: boolean;
  lineHeight: number;
  charSpacing: number;
};

export type CanvasSelectionState =
  | { kind: "none" }
  | { kind: "object" }
  | { kind: "text"; style: TextStyleState }
  | { kind: "image"; style: ImageStyleState };

export {
  BUILDER_FONT_GROUPS,
  BUILDER_FONT_OPTIONS,
  DEFAULT_BUILDER_FONT,
};

/** @deprecated BUILDER_FONT_OPTIONS 사용 — 하위 호환 */
export const TEXT_FONT_OPTIONS = BUILDER_FONT_OPTIONS.map(({ label, value }) => ({
  label,
  value,
}));

export const TEXT_SIZE_OPTIONS = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96,
];

export const TEXT_LINE_HEIGHT_OPTIONS = [0.8, 1, 1.2, 1.5, 1.8, 2];
