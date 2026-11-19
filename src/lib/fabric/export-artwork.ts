import type {
  BuilderOptions,
  DesignJson,
  MockupOffset,
  ViewSide,
} from "@/types/builder";
import { resolveSideLabel } from "@/types/builder";
import { createBagCanvas, type TaggedObject } from "./bag-canvas";
import { computeMockupPlacement } from "./mockup-builder";
import {
  getPrintExportPixelSize,
  PRINT_EXPORT_DPI,
} from "./print-export";
import { loadBuilderFonts } from "@/lib/builder-fonts";

export type ArtworkExportResult = {
  blob: Blob;
  filename: string;
  widthPx: number;
  heightPx: number;
  widthCm: number;
  heightCm: number;
  dpi: number;
  side: ViewSide;
};

function hasDesignObjects(designJson: DesignJson | null | undefined): boolean {
  return (
    !!designJson &&
    Array.isArray(designJson.objects) &&
    designJson.objects.length > 0
  );
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((res) => res.blob());
}

/** 저장된 디자인을 인쇄 영역 기준 300dpi PNG(투명 배경)로 렌더 */
export async function renderArtworkPng(
  designJson: DesignJson | null,
  options: BuilderOptions,
  side: ViewSide,
  mockupOffset: MockupOffset,
  meta?: { orderNumber?: string },
): Promise<ArtworkExportResult | null> {
  if (!hasDesignObjects(designJson)) return null;

  const refW =
    typeof designJson!.canvasWidth === "number" ? designJson!.canvasWidth : 900;
  const refH =
    typeof designJson!.canvasHeight === "number"
      ? designJson!.canvasHeight
      : 700;

  const el = document.createElement("canvas");
  const { canvas, handle } = await createBagCanvas(
    el,
    refW,
    refH,
    options,
    side,
  );

  try {
    handle.updateMockup(options, side, mockupOffset);
    await loadBuilderFonts();
    await handle.importJson(designJson);

    canvas
      .getObjects()
      .filter((obj) => !!(obj as TaggedObject).jhMeta)
      .forEach((obj) => canvas.remove(obj));

    canvas.backgroundColor = "transparent";
    canvas.requestRenderAll();

    const placement = computeMockupPlacement(
      refW,
      refH,
      options,
      side,
      mockupOffset,
    );
    const print = placement.printArea;
    if (print.width < 1 || print.height < 1) return null;

    const pixelSize = getPrintExportPixelSize(options);
    const multiplier = pixelSize.width / print.width;

    const dataUrl = canvas.toDataURL({
      format: "png",
      left: print.left,
      top: print.top,
      width: print.width,
      height: print.height,
      multiplier,
      enableRetinaScaling: false,
    });

    const blob = await dataUrlToBlob(dataUrl);
    const sideSlug =
      side === "front" ? "front" : side === "back" ? "back" : "side";
    const prefix = meta?.orderNumber?.replace(/[^\w-]+/g, "_") ?? "artwork";
    const filename = `${prefix}_${sideSlug}_300dpi_${pixelSize.widthCm}x${pixelSize.heightCm}cm.png`;

    return {
      blob,
      filename,
      widthPx: Math.round(print.width * multiplier),
      heightPx: Math.round(print.height * multiplier),
      widthCm: pixelSize.widthCm,
      heightCm: pixelSize.heightCm,
      dpi: PRINT_EXPORT_DPI,
      side,
    };
  } finally {
    handle.dispose();
  }
}

export function downloadArtworkExport(result: ArtworkExportResult) {
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadArtworkPng(
  designJson: DesignJson | null,
  options: BuilderOptions,
  side: ViewSide,
  mockupOffset: MockupOffset,
  meta?: { orderNumber?: string },
): Promise<ArtworkExportResult | null> {
  const result = await renderArtworkPng(
    designJson,
    options,
    side,
    mockupOffset,
    meta,
  );
  if (result) downloadArtworkExport(result);
  return result;
}

/** @deprecated PNG export 사용 */
export const renderArtworkJpeg = renderArtworkPng;
/** @deprecated PNG export 사용 */
export const downloadArtworkJpeg = downloadArtworkPng;

export function formatArtworkExportLabel(side: ViewSide): string {
  return `${resolveSideLabel(side)} PNG (300dpi)`;
}
