import type { BuilderOptions, ProductType, SizeOption, ViewSide } from "@/types/builder";
import {
  PRINT_AREA_CM,
  PRINT_AREA_REFERENCE_CM,
  SIZE_DIMENSIONS,
  bagSizeScale,
} from "@/types/builder";
import { FABRIC_COLORS, HANDLE_COLORS } from "./mockup-styles";

export type PrintRegion = { x: number; y: number; w: number; h: number };

export type PhotoMockup = {
  src: string;
  width: number;
  height: number;
  /** PNG 투명 배경 — 알파 채널로 색상 마스크 */
  hasAlpha?: boolean;
  print: PrintRegion;
  tint: PrintRegion;
  /** 목업 PNG와 픽셀 정렬된 본체·손잡이 마스크 (있을 때만 분리 틴트) */
  bodyMaskSrc?: string;
  handleMaskSrc?: string;
};

const ECOBAG_FRONT: PhotoMockup = {
  src: "/mockups/ecobag-front-removebg-preview.png",
  width: 394,
  height: 526,
  hasAlpha: true,
  print: { x: 0.1, y: 0.3, w: 0.8, h: 0.62 },
  tint: { x: 0.07, y: 0.03, w: 0.86, h: 0.94 },
  bodyMaskSrc: "/mockups/ecobag_body_original_position.png",
  handleMaskSrc: "/mockups/ecobag_handle_original_position.png",
};

const ECOBAG_BACK: PhotoMockup = {
  src: "/mockups/ecobag-back.png",
  width: 430,
  height: 548,
  hasAlpha: true,
  print: { x: 0.1, y: 0.3, w: 0.8, h: 0.62 },
  tint: { x: 0.08, y: 0.04, w: 0.84, h: 0.9 },
  bodyMaskSrc: "/mockups/ecobag_back_body_original_position.png",
  handleMaskSrc: "/mockups/ecobag_back_handle_original_position.png",
};

/** 측면은 사진 없음 — 앞면 사진 + 오버레이 */
const ECOBAG_SIDE: PhotoMockup = {
  ...ECOBAG_FRONT,
  print: { x: 0.2, y: 0.35, w: 0.55, h: 0.45 },
};

const PHOTO_MOCKUPS: Partial<
  Record<ProductType, Partial<Record<ViewSide, PhotoMockup>>>
> = {
  ecobag: {
    front: ECOBAG_FRONT,
    back: ECOBAG_BACK,
    side: ECOBAG_SIDE,
  },
};

const SVG_VIEWBOX: Record<ProductType, { w: number; h: number }> = {
  ecobag: { w: 440, h: 520 },
  "shopping-bag": { w: 440, h: 400 },
  pouch: { w: 320, h: 360 },
};

const SVG_PRINT: Record<ProductType, PrintRegion> = {
  ecobag: { x: 0.284, y: 0.298, w: 0.432, h: 0.442 },
  "shopping-bag": { x: 0.18, y: 0.2, w: 0.64, h: 0.52 },
  pouch: { x: 0.22, y: 0.28, w: 0.56, h: 0.45 },
};

export const VIEWBOX_SIZES = SVG_VIEWBOX;

function sizeScale(size: SizeOption): number {
  return bagSizeScale(size);
}

type Rect = { left: number; top: number; width: number; height: number };

/** 목업 비율 기준 영역을 17×20cm 실측에 맞게 축소 */
function fitPrintAreaToCm(area: Rect): Rect {
  const scaleW = PRINT_AREA_CM.w / PRINT_AREA_REFERENCE_CM.w;
  const scaleH = PRINT_AREA_CM.h / PRINT_AREA_REFERENCE_CM.h;
  const cx = area.left + area.width / 2;
  const cy = area.top + area.height / 2;
  const width = Math.round(area.width * scaleW);
  const height = Math.round(area.height * scaleH);
  return {
    left: Math.round(cx - width / 2),
    top: Math.round(cy - height / 2),
    width,
    height,
  };
}

export function getPhotoMockup(
  productType: ProductType,
  side: ViewSide,
): PhotoMockup | null {
  return PHOTO_MOCKUPS[productType]?.[side] ?? null;
}

const SPLIT_MOCKUP_FILES = new Set([
  "tote_front-removebg-preview",
  "tote_back-removebg-preview",
  "canvas_front-removebg-preview",
  "canvas_back-removebg-preview",
  "mini_front-removebg-preview",
  "mini_back-removebg-preview",
  "wine_bag_mockup_front-removebg-preview",
  "wine_bag_mockup_back-removebg-preview",
]);

/** 스튜디오 사진 목업은 본체·손잡이를 나눠 둔 컷아웃을 쓴다 */
function splitMockupParts(imageUrl: string): {
  bodyMaskSrc: string;
  handleMaskSrc: string;
} | null {
  const file = imageUrl.match(/\/mockups\/([^/]+)\.png$/)?.[1];
  if (!file || !SPLIT_MOCKUP_FILES.has(file)) return null;
  return {
    bodyMaskSrc: `/mockups/parts/${file}_body.png?v=3`,
    handleMaskSrc: `/mockups/parts/${file}_handle.png?v=3`,
  };
}

/** DB 목업 면 → PhotoMockup. 분할 컷아웃이 있으면 본체와 손잡이를 따로 칠한다 */
export function photoMockupFromDbFace(
  face: {
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    printX: number;
    printY: number;
    printW: number;
    printH: number;
  },
  productType: ProductType,
  side: ViewSide,
): PhotoMockup {
  const code = getPhotoMockup(productType, side);
  const print = {
    x: face.printX,
    y: face.printY,
    w: face.printW,
    h: face.printH,
  };
  const usesBuiltinPhoto = Boolean(code && code.src === face.imageUrl);
  const parts = splitMockupParts(face.imageUrl);
  return {
    src: face.imageUrl,
    width: face.imageWidth,
    height: face.imageHeight,
    hasAlpha: Boolean(parts) || (usesBuiltinPhoto ? (code?.hasAlpha ?? false) : false),
    print,
    tint: usesBuiltinPhoto ? (code?.tint ?? print) : print,
    bodyMaskSrc: parts?.bodyMaskSrc ?? (usesBuiltinPhoto ? code?.bodyMaskSrc : undefined),
    handleMaskSrc: parts?.handleMaskSrc ?? (usesBuiltinPhoto ? code?.handleMaskSrc : undefined),
  };
}

export interface MockupPlacement {
  imgLeft: number;
  imgTop: number;
  imgWidth: number;
  imgHeight: number;
  printArea: { left: number; top: number; width: number; height: number };
  tintArea: { left: number; top: number; width: number; height: number };
  labelY: number;
  mockupSrc: string;
  usePhoto: boolean;
  hasAlpha: boolean;
  bodyMaskSrc: string | null;
  handleMaskSrc: string | null;
}

export function computeMockupPlacement(
  canvasW: number,
  canvasH: number,
  options: BuilderOptions,
  side: ViewSide,
  offset: { x: number; y: number } = { x: 0, y: 0 },
  photoOverride: PhotoMockup | null = null,
): MockupPlacement {
  const photo =
    photoOverride ?? getPhotoMockup(options.productType, side);
  const scaleFactor = sizeScale(options.size);

  if (photo) {
    const scale =
      Math.min(
        (canvasW * 0.5) / photo.width,
        (canvasH * 0.68) / photo.height,
      ) * scaleFactor;

    const imgWidth = photo.width * scale;
    const imgHeight = photo.height * scale;
    const imgLeft = (canvasW - imgWidth) / 2 + offset.x;
    const imgTop = (canvasH - imgHeight) / 2 + offset.y;

    const rawPrint = {
      left: Math.round(imgLeft + photo.print.x * imgWidth),
      top: Math.round(imgTop + photo.print.y * imgHeight),
      width: Math.round(photo.print.w * imgWidth),
      height: Math.round(photo.print.h * imgHeight),
    };
    /** DB에서 지정한 인쇄영역은 그대로 사용. 코드 폴백만 실측 비율로 맞춤 */
    const printArea = photoOverride ? rawPrint : fitPrintAreaToCm(rawPrint);

    const tintArea = {
      left: Math.round(imgLeft + photo.tint.x * imgWidth),
      top: Math.round(imgTop + photo.tint.y * imgHeight),
      width: Math.round(photo.tint.w * imgWidth),
      height: Math.round(photo.tint.h * imgHeight),
    };

    return {
      imgLeft,
      imgTop,
      imgWidth,
      imgHeight,
      printArea,
      tintArea,
      labelY: printArea.top - 18,
      mockupSrc: photo.src,
      usePhoto: true,
      hasAlpha: photo.hasAlpha ?? false,
      bodyMaskSrc: photo.bodyMaskSrc ?? null,
      handleMaskSrc: photo.handleMaskSrc ?? null,
    };
  }

  const vb = SVG_VIEWBOX[options.productType];
  const region = SVG_PRINT[options.productType];
  const scale =
    Math.min((canvasW * 0.72) / vb.w, (canvasH * 0.92) / vb.h) * scaleFactor;

  const imgWidth = vb.w * scale;
  const imgHeight = vb.h * scale;
  const imgLeft = (canvasW - imgWidth) / 2 + offset.x;
  const imgTop = (canvasH - imgHeight) / 2 + offset.y;

  const printArea = fitPrintAreaToCm({
    left: Math.round(imgLeft + region.x * imgWidth),
    top: Math.round(imgTop + region.y * imgHeight),
    width: Math.round(region.w * imgWidth),
    height: Math.round(region.h * imgHeight),
  });

  return {
    imgLeft,
    imgTop,
    imgWidth,
    imgHeight,
    printArea,
    tintArea: printArea,
    labelY: printArea.top - 20,
    mockupSrc: "",
    usePhoto: false,
    hasAlpha: false,
    bodyMaskSrc: null,
    handleMaskSrc: null,
  };
}

export function getSizeLabel(size: SizeOption): string {
  const d = SIZE_DIMENSIONS[size];
  return `${size} (${d.w}×${d.h}cm)`;
}

export function getProductTitle(options: BuilderOptions): string {
  const name =
    options.productType === "ecobag"
      ? "사각 에코백"
      : options.productType === "shopping-bag"
        ? "장바구니"
        : "파우치";
  const sizeName =
    options.size === "S" ? "소형" : options.size === "M" ? "중형" : "대형";
  return `${name} (${sizeName})`;
}

/* SVG fallback for non-photo products */
function buildShoppingBagSvg(fabric: string, handle: string): string {
  const handleY = handle === "long" ? 25 : 45;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="400" viewBox="0 0 440 400">
    <ellipse cx="220" cy="382" rx="175" ry="12" fill="rgba(0,0,0,0.12)"/>
    <rect x="55" y="${handleY}" width="12" height="55" rx="4" fill="${handle}"/>
    <rect x="373" y="${handleY}" width="12" height="55" rx="4" fill="${handle}"/>
    <rect x="55" y="${handleY}" width="330" height="8" rx="3" fill="${handle}"/>
    <rect x="40" y="78" width="360" height="290" rx="6" fill="${fabric}" stroke="#6b7280" stroke-width="2.5"/>
  </svg>`;
}

function buildPouchSvg(fabric: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="360" viewBox="0 0 320 360">
    <ellipse cx="160" cy="345" rx="110" ry="10" fill="rgba(0,0,0,0.12)"/>
    <rect x="45" y="64" width="230" height="260" rx="22" fill="${fabric}" stroke="#6b7280" stroke-width="2.5"/>
  </svg>`;
}

export function buildMockupSvg(
  options: BuilderOptions,
  side: ViewSide,
): string | null {
  if (getPhotoMockup(options.productType, side)) return null;

  const fabric = FABRIC_COLORS[options.fabric];
  const handle = HANDLE_COLORS[options.handle];

  switch (options.productType) {
    case "shopping-bag":
      return buildShoppingBagSvg(fabric, handle);
    case "pouch":
      return buildPouchSvg(fabric);
    default:
      return null;
  }
}

export function svgToDataUrl(svg: string): string {
  if (typeof window === "undefined") {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  return URL.createObjectURL(blob);
}
