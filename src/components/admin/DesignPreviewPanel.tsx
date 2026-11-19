"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { BagMockupView } from "@/components/builder/BagMockupView";
import { createBagCanvas } from "@/lib/fabric/bag-canvas";
import {
  computeMockupPlacement,
  photoMockupFromDbFace,
} from "@/lib/fabric/mockup-builder";
import type { ProductMockupFaceDto } from "@/lib/product-mockup";
import {
  getCanvasScale,
  scaleMockupOffset,
} from "@/lib/fabric/canvas-scale";
import type { SavedBuilderPayload } from "@/types/saved-design";
import {
  getDesignViewSides,
  resolveSideLabel,
  type AnnotationItem,
  type ViewSide,
} from "@/types/builder";

function sidesFromPayload(payload: SavedBuilderPayload): ViewSide[] {
  const fromDesign = Object.keys(payload.designData ?? {});
  const fromOffsets = Object.keys(payload.mockupOffsets ?? {});
  const merged = [...new Set([...fromDesign, ...fromOffsets])];
  if (merged.length > 0) return merged;
  return getDesignViewSides(
    payload.options.productType,
    payload.options.printSide,
  );
}

interface DesignPreviewPanelProps {
  payload: SavedBuilderPayload;
  mockupFaces?: ProductMockupFaceDto[];
  side: ViewSide;
  onSideChange: (side: ViewSide) => void;
  annotations?: AnnotationItem[];
  highlightAnnotationId?: string | null;
}

export function DesignPreviewPanel({
  payload,
  mockupFaces = [],
  side,
  onSideChange,
  annotations = [],
  highlightAnnotationId,
}: DesignPreviewPanelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<Awaited<
    ReturnType<typeof createBagCanvas>
  >["handle"] | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);

  useEffect(() => {
    if (highlightAnnotationId) setShowAnnotations(true);
  }, [highlightAnnotationId]);

  const sides = sidesFromPayload(payload);
  const mockupOffset = payload.mockupOffsets[side];
  const designJson = payload.designData[side];
  const scaledMockupOffset = useMemo(() => {
    if (dims.w < 100 || dims.h < 100) return mockupOffset;
    const { scaleX, scaleY } = getCanvasScale(designJson, dims.w, dims.h);
    return scaleMockupOffset(mockupOffset, scaleX, scaleY);
  }, [
    mockupOffset,
    designJson,
    dims.w,
    dims.h,
    mockupOffset.x,
    mockupOffset.y,
  ]);

  const mockupKey = `${payload.options.productType}-${payload.options.size}-${payload.options.fabric}-${payload.options.bagColor}-${payload.options.handleStrapColor}-${payload.options.handle}-${payload.options.pocket}-${side}`;

  const dbFace = useMemo(
    () => mockupFaces.find((face) => face.side === side) ?? null,
    [mockupFaces, side],
  );

  const placement = useMemo(() => {
    if (dims.w < 100 || dims.h < 100) return null;
    const photoOverride = dbFace
      ? photoMockupFromDbFace(dbFace, payload.options.productType, side)
      : null;
    return computeMockupPlacement(
      dims.w,
      dims.h,
      payload.options,
      side,
      scaledMockupOffset,
      photoOverride,
    );
  }, [dims.w, dims.h, payload.options, side, mockupKey, scaledMockupOffset.x, scaledMockupOffset.y, dbFace]);

  useEffect(() => {
    const container = wrapperRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      if (w > 100 && h > 100) {
        setDims((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const fabricMountKey = `${dims.w}x${dims.h}-${mockupFaces.map((face) => face.imageUrl).join("|")}`;

  useEffect(() => {
    const el = canvasElRef.current;
    if (!el || dims.w < 100 || dims.h < 100) return;

    let cancelled = false;
    setReady(false);
    setError(null);

    createBagCanvas(
      el,
      dims.w,
      dims.h,
      payload.options,
      side,
      undefined,
      undefined,
      undefined,
      undefined,
      (viewSide) => {
        const face = mockupFaces.find((item) => item.side === viewSide);
        if (!face) return null;
        return photoMockupFromDbFace(
          face,
          payload.options.productType,
          viewSide,
        );
      },
    )
      .then(async ({ canvas, handle }) => {
        if (cancelled) {
          handle.dispose();
          return;
        }

        canvas.selection = false;
        handleRef.current = handle;
        handle.updateMockup(payload.options, side, scaledMockupOffset);
        if (designJson) {
          await handle.importJson(designJson);
        }

        canvas.getObjects().forEach((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        canvas.requestRenderAll();

        setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "미리보기 로드 실패");
        }
      });

    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
      setReady(false);
    };
  }, [fabricMountKey]);

  useEffect(() => {
    if (!handleRef.current || !ready) return;
    handleRef.current.updateMockup(payload.options, side, scaledMockupOffset);
    void handleRef.current.importJson(designJson);
  }, [side, designJson, ready, scaledMockupOffset.x, scaledMockupOffset.y, payload.options, mockupKey]);

  const visiblePins = annotations.filter((a) => a.side === side);
  const showMockup =
    placement?.usePhoto && placement.mockupSrc && placement.mockupSrc.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
        <div className="flex gap-1.5">
          {sides.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSideChange(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                side === s
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {resolveSideLabel(s)}
            </button>
          ))}
        </div>
        {annotations.length > 0 && (
          <label className="flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={showAnnotations}
              onChange={(e) => setShowAnnotations(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            주석 표시
          </label>
        )}
      </div>

      <div
        ref={wrapperRef}
        className="relative min-h-[320px] flex-1 bg-[#f0f2f5]"
      >
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          {showMockup && placement && (
            <BagMockupView
              key={side}
              placement={placement}
              bagColor={payload.options.bagColor ?? "cream"}
              handleStrapColor={payload.options.handleStrapColor}
            />
          )}
        </div>

        {dims.w > 0 && dims.h > 0 && (
          <div
            key={fabricMountKey}
            className="pointer-events-none absolute inset-0 z-10"
            style={{ width: dims.w, height: dims.h }}
          >
            <canvas
              ref={canvasElRef}
              width={dims.w}
              height={dims.h}
              style={{ width: dims.w, height: dims.h, display: "block" }}
            />
          </div>
        )}

        {dims.w > 0 && dims.h > 0 && showAnnotations && (
          <div
            className="pointer-events-none absolute inset-0 z-[15]"
            style={{ width: dims.w, height: dims.h }}
          >
            {visiblePins.map((pin) => (
              <PreviewPin
                key={pin.id}
                pin={pin}
                canvasWidth={dims.w}
                canvasHeight={dims.h}
                active={highlightAnnotationId === pin.id}
              />
            ))}
          </div>
        )}

        {!ready && !error && dims.w > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#f0f2f5]/80 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            작업물 로딩 중…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewPin({
  pin,
  canvasWidth,
  canvasHeight,
  active,
}: {
  pin: AnnotationItem;
  canvasWidth: number;
  canvasHeight: number;
  active: boolean;
}) {
  const left = pin.x * canvasWidth;
  const top = pin.y * canvasHeight;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left, top: top + 6 }}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow ${
          active ? "bg-blue-600 ring-2 ring-blue-300" : "bg-zinc-800"
        }`}
      >
        {pin.number}
      </span>
    </div>
  );
}
