import type { Canvas, FabricObject } from "fabric";
import type { BuilderOptions, MockupOffset, ViewSide } from "@/types/builder";
import type { CanvasSelectionState, TextStyleState } from "@/types/text-style";
import { DEFAULT_BUILDER_FONT } from "@/lib/builder-fonts";
import type { ImageStyleState } from "@/types/image-style";
import {
  getCanvasScale,
  scaleFabricObject,
} from "./canvas-scale";
import {
  applyImageStylePatch,
  isImageObject,
  readImageStyle,
} from "./image-style-utils";
import { CanvasHistory } from "./canvas-history";
import {
  applyTextStylePatch,
  isTextObject,
  readTextStyle,
} from "./text-style-utils";
import {
  buildMockupSvg,
  computeMockupPlacement,
  svgToDataUrl,
  type PhotoMockup,
} from "./mockup-builder";

export type JHMeta = "mockup-image";

export type TaggedObject = FabricObject & { jhMeta?: JHMeta };

export type LayerInfo = {
  id: string;
  stackIndex: number;
  type: "text" | "image" | "other";
  label: string;
};

type UserObject = FabricObject & { jhLayerId?: string };

export interface BagCanvasHandle {
  exportJson: () => Record<string, unknown>;
  importJson: (json: Record<string, unknown> | null) => Promise<void>;
  addText: (text?: string) => void;
  addImageFromFile: (file: File) => Promise<void>;
  deleteSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  getLayers: () => LayerInfo[];
  selectLayer: (stackIndex: number) => void;
  moveLayerUp: (stackIndex: number) => void;
  moveLayerDown: (stackIndex: number) => void;
  deleteLayer: (stackIndex: number) => void;
  clearDesign: () => void;
  updateMockup: (
    options: BuilderOptions,
    side: ViewSide,
    offset?: MockupOffset,
  ) => void;
  undo: () => void;
  redo: () => void;
  focus: () => void;
  getJsonString: () => string;
  checkOutOfBounds: () => boolean;
  dispose: () => void;
  getSelectionState: () => CanvasSelectionState;
  updateTextStyle: (patch: Partial<TextStyleState>) => void;
  updateImageStyle: (patch: Partial<ImageStyleState>) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  centerSelected: () => void;
}

function tag(obj: FabricObject, meta: JHMeta) {
  (obj as TaggedObject).jhMeta = meta;
  return obj;
}

function isUserObject(obj: FabricObject) {
  return !(obj as TaggedObject).jhMeta;
}

function isMockupObject(obj: FabricObject) {
  return !!(obj as TaggedObject).jhMeta;
}

function getLayerLabel(obj: FabricObject): { type: LayerInfo["type"]; label: string } {
  const t = obj.type ?? "";
  if (t === "i-text" || t === "text" || t === "textbox") {
    const text = (obj as { text?: string }).text ?? "";
    return { type: "text", label: text.trim() || "텍스트" };
  }
  if (t === "image") return { type: "image", label: "이미지" };
  return { type: "other", label: "요소" };
}

export async function createBagCanvas(
  el: HTMLCanvasElement,
  canvasW: number,
  canvasH: number,
  options: BuilderOptions,
  side: ViewSide,
  onDesignChange?: () => void,
  onSelectionChange?: (state: CanvasSelectionState) => void,
  onMockupOffsetChange?: (offset: MockupOffset) => void,
  onMockupDragDelta?: (dx: number, dy: number, side: ViewSide) => void,
  getPhotoOverride?: (side: ViewSide) => PhotoMockup | null,
): Promise<{ canvas: Canvas; handle: BagCanvasHandle }> {
  const { Canvas, IText, FabricImage } = await import("fabric");

  const canvas = new Canvas(el, {
    width: canvasW,
    height: canvasH,
    backgroundColor: "transparent",
    preserveObjectStacking: true,
    selection: true,
    enableRetinaScaling: false,
  });

  let currentSide = side;
  let currentOptions = { ...options };
  let currentMockupOffset: MockupOffset = { x: 0, y: 0 };
  let mockupGen = 0;
  let isRestoring = false;
  let lastBlobUrl: string | null = null;
  let defaultCenter = { x: canvasW / 2, y: canvasH / 2 };
  let defaultMaxWidth = canvasW * 0.4;
  let layerIdSeq = 0;
  const history = new CanvasHistory();

  const notifyDesignChange = () => {
    if (!isRestoring) onDesignChange?.();
  };

  const getActiveTextObject = () => {
    const obj = canvas.getActiveObject();
    if (!obj || !isUserObject(obj) || !isTextObject(obj)) return null;
    return obj;
  };

  const getActiveImageObject = () => {
    const obj = canvas.getActiveObject();
    if (!obj || !isUserObject(obj) || !isImageObject(obj)) return null;
    return obj;
  };

  const getSelectionState = (): CanvasSelectionState => {
    const obj = canvas.getActiveObject();
    if (!obj || !isUserObject(obj)) return { kind: "none" };
    if (isTextObject(obj)) return { kind: "text", style: readTextStyle(obj) };
    if (isImageObject(obj)) return { kind: "image", style: readImageStyle(obj) };
    return { kind: "object" };
  };

  const notifySelectionChange = () => {
    onSelectionChange?.(getSelectionState());
  };

  const updateTextStyle = (patch: Partial<TextStyleState>) => {
    const text = getActiveTextObject();
    if (!text) return;
    applyTextStylePatch(text, patch);
    text.setCoords();
    canvas.requestRenderAll();
    saveHistory();
    notifyDesignChange();
    notifySelectionChange();
  };

  const updateImageStyle = (patch: Partial<ImageStyleState>) => {
    const img = getActiveImageObject();
    if (!img) return;
    applyImageStylePatch(img, patch);
    img.setCoords();
    canvas.requestRenderAll();
    saveHistory();
    notifyDesignChange();
    notifySelectionChange();
  };

  const nudgeSelected = (dx: number, dy: number) => {
    const obj = canvas.getActiveObject();
    if (!obj || !isUserObject(obj)) return;
    obj.set({
      left: (obj.left ?? 0) + dx,
      top: (obj.top ?? 0) + dy,
    });
    obj.setCoords();
    canvas.requestRenderAll();
    saveHistory();
    notifyDesignChange();
    notifySelectionChange();
  };

  const centerSelected = () => {
    const obj = canvas.getActiveObject();
    if (!obj || !isUserObject(obj)) return;
    obj.set({
      left: defaultCenter.x,
      top: defaultCenter.y,
      originX: "center",
      originY: "center",
    });
    obj.setCoords();
    canvas.requestRenderAll();
    saveHistory();
    notifyDesignChange();
    notifySelectionChange();
  };

  const ensureLayerId = (obj: FabricObject) => {
    const o = obj as UserObject;
    if (!o.jhLayerId) o.jhLayerId = `layer-${++layerIdSeq}`;
    return o.jhLayerId;
  };

  const getUserObjects = () => canvas.getObjects().filter(isUserObject);

  const serializeUserObjects = () =>
    JSON.stringify(getUserObjects().map((o) => o.toObject()));

  const saveHistory = () => {
    if (isRestoring) return;
    history.push(serializeUserObjects());
  };

  const removeMockupObjects = () => {
    canvas.getObjects().filter(isMockupObject).forEach((o) => canvas.remove(o));
  };

  const getPlacement = () =>
    computeMockupPlacement(
      canvasW,
      canvasH,
      currentOptions,
      currentSide,
      currentMockupOffset,
      getPhotoOverride?.(currentSide) ?? null,
    );

  const isPointInMockup = (x: number, y: number) => {
    const pl = getPlacement();
    if (!pl.usePhoto) return false;
    return (
      x >= pl.imgLeft &&
      x <= pl.imgLeft + pl.imgWidth &&
      y >= pl.imgTop &&
      y <= pl.imgTop + pl.imgHeight
    );
  };

  const updatePlacementHints = () => {
    const placement = getPlacement();
    defaultCenter = {
      x: placement.imgLeft + placement.imgWidth / 2,
      y: placement.imgTop + placement.imgHeight / 2,
    };
    defaultMaxWidth = placement.imgWidth * 0.55;
  };

  const loadUserObjects = async (json: string) => {
    isRestoring = true;
    getUserObjects().forEach((o) => canvas.remove(o));
    const objects = JSON.parse(json) as Record<string, unknown>[];
    if (objects.length) {
      const { util } = await import("fabric");
      const enlivened = await util.enlivenObjects(objects);
      enlivened.forEach((obj) => {
        const fabricObj = obj as FabricObject;
        ensureLayerId(fabricObj);
        if (isImageObject(fabricObj)) {
          fabricObj.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            lockMovementX: false,
            lockMovementY: false,
            cornerStyle: "circle",
            cornerColor: "#3b82f6",
            borderColor: "#3b82f6",
            cornerSize: 10,
            transparentCorners: false,
          });
        }
        canvas.add(fabricObj);
      });
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    isRestoring = false;
    notifyDesignChange();
    notifySelectionChange();
  };

  const buildMockup = async () => {
    const gen = ++mockupGen;
    removeMockupObjects();
    updatePlacementHints();

    const placement = getPlacement();

    let imgUrl = placement.mockupSrc;
    if (!placement.usePhoto) {
      const svg = buildMockupSvg(currentOptions, currentSide);
      if (svg) {
        if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
        imgUrl = svgToDataUrl(svg);
        lastBlobUrl = imgUrl;
      }
    }

    if (imgUrl && !placement.usePhoto) {
      try {
        const img = await FabricImage.fromURL(imgUrl, {
          crossOrigin: "anonymous",
        });
        if (gen !== mockupGen) return;

        const naturalW = placement.imgWidth;
        const naturalH = placement.imgHeight;
        img.set({
          left: placement.imgLeft,
          top: placement.imgTop,
          scaleX: placement.imgWidth / (img.width || naturalW),
          scaleY: placement.imgHeight / (img.height || naturalH),
          originX: "left",
          originY: "top",
          selectable: false,
          evented: false,
          objectCaching: true,
        });
        tag(img, "mockup-image");
        canvas.add(img);
        canvas.sendObjectToBack(img);
      } catch {
        /* SVG fallback failed */
      }
    }

    canvas.requestRenderAll();
  };

  await buildMockup();
  history.reset(serializeUserObjects());

  canvas.on("object:modified", () => {
    saveHistory();
    notifyDesignChange();
    notifySelectionChange();
  });
  canvas.on("object:moving", notifySelectionChange);
  canvas.on("object:scaling", notifySelectionChange);
  canvas.on("object:rotating", notifySelectionChange);
  canvas.on("object:added", (e) => {
    const obj = e.target as FabricObject;
    if (isUserObject(obj)) {
      ensureLayerId(obj);
      saveHistory();
      notifyDesignChange();
      notifySelectionChange();
    }
  });
  canvas.on("object:removed", (e) => {
    if (isUserObject(e.target as FabricObject)) {
      saveHistory();
      notifyDesignChange();
      notifySelectionChange();
    }
  });

  canvas.on("selection:created", notifySelectionChange);
  canvas.on("selection:updated", notifySelectionChange);
  canvas.on("selection:cleared", notifySelectionChange);
  canvas.on("text:changed", notifySelectionChange);

  let draggingMockup = false;
  let mockupDragLast: { x: number; y: number } | null = null;
  let mockupDragMoved = false;

  const moveSceneWithMockup = (dx: number, dy: number) => {
    if (dx === 0 && dy === 0) return;
    mockupDragMoved = true;
    currentMockupOffset = {
      x: currentMockupOffset.x + dx,
      y: currentMockupOffset.y + dy,
    };
    getUserObjects().forEach((obj) => {
      obj.set({
        left: (obj.left ?? 0) + dx,
        top: (obj.top ?? 0) + dy,
      });
      obj.setCoords();
    });
    updatePlacementHints();
    onMockupOffsetChange?.(currentMockupOffset);
    onMockupDragDelta?.(dx, dy, currentSide);
    canvas.requestRenderAll();
  };

  canvas.on("mouse:down", (opt) => {
    if (opt.target) return;
    const p = canvas.getScenePoint(opt.e);
    if (!isPointInMockup(p.x, p.y)) return;
    draggingMockup = true;
    mockupDragMoved = false;
    mockupDragLast = { x: p.x, y: p.y };
    canvas.selection = false;
    canvas.setCursor("move");
  });

  canvas.on("mouse:move", (opt) => {
    const p = canvas.getScenePoint(opt.e);
    if (draggingMockup && mockupDragLast) {
      const dx = p.x - mockupDragLast.x;
      const dy = p.y - mockupDragLast.y;
      if (dx !== 0 || dy !== 0) {
        mockupDragLast = { x: p.x, y: p.y };
        moveSceneWithMockup(dx, dy);
      }
      return;
    }
    canvas.setCursor(
      !opt.target && isPointInMockup(p.x, p.y) ? "move" : "default",
    );
  });

  canvas.on("mouse:up", () => {
    if (!draggingMockup) return;
    if (mockupDragMoved) {
      saveHistory();
      notifyDesignChange();
    }
    draggingMockup = false;
    mockupDragLast = null;
    mockupDragMoved = false;
    canvas.selection = true;
    canvas.setCursor("default");
  });

  const updateMockup = (
    opts: BuilderOptions,
    newSide: ViewSide,
    offset?: MockupOffset,
  ) => {
    currentOptions = { ...opts };
    currentSide = newSide;
    if (offset) currentMockupOffset = offset;
    void buildMockup();
  };

  const exportJson = () => ({
    objects: getUserObjects().map((o) => o.toObject()),
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    side: currentSide,
    options: currentOptions,
  });

  const importJson = async (json: Record<string, unknown> | null) => {
    getUserObjects().forEach((o) => canvas.remove(o));
    if (json?.objects && Array.isArray(json.objects) && json.objects.length) {
      const { scaleX, scaleY } = getCanvasScale(json, canvasW, canvasH);
      const { util } = await import("fabric");
      const enlivened = await util.enlivenObjects(
        json.objects as Record<string, unknown>[],
      );
      enlivened.forEach((obj) => {
        const fabricObj = obj as FabricObject;
        scaleFabricObject(fabricObj, scaleX, scaleY);
        ensureLayerId(fabricObj);
        if (isImageObject(fabricObj)) {
          fabricObj.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            lockMovementX: false,
            lockMovementY: false,
            cornerStyle: "circle",
            cornerColor: "#3b82f6",
            borderColor: "#3b82f6",
            cornerSize: 10,
            transparentCorners: false,
          });
        }
        canvas.add(fabricObj);
      });
    }
    canvas.requestRenderAll();
    history.reset(serializeUserObjects());
    notifyDesignChange();
    notifySelectionChange();
  };

  const addText = (text = "문구 입력") => {
    const item = new IText(text, {
      left: defaultCenter.x,
      top: defaultCenter.y,
      originX: "center",
      originY: "center",
      fontFamily: DEFAULT_BUILDER_FONT,
      fontSize: 28,
      fill: "#18181b",
    });
    canvas.add(item);
    canvas.setActiveObject(item);
    canvas.requestRenderAll();
    notifyDesignChange();
    notifySelectionChange();
  };

  const addImageFromFile = async (file: File) => {
    const { fileToDataUrl } = await import("./image-persist");
    const dataUrl = await fileToDataUrl(file);
    const img = await FabricImage.fromURL(dataUrl);
    if (img.width && img.width > defaultMaxWidth) {
      img.scale(defaultMaxWidth / img.width);
    }
    img.set({
      left: defaultCenter.x,
      top: defaultCenter.y,
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockMovementX: false,
      lockMovementY: false,
      cornerStyle: "circle",
      cornerColor: "#3b82f6",
      borderColor: "#3b82f6",
      cornerSize: 10,
      transparentCorners: false,
    });
    ensureLayerId(img);
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    notifyDesignChange();
    notifySelectionChange();
  };

  const deleteSelected = () => {
    const toRemove = canvas.getActiveObjects().filter(isUserObject);
    if (!toRemove.length) return;
    toRemove.forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    notifySelectionChange();
  };

  const bringForward = () => {
    const obj = canvas.getActiveObject();
    if (obj && isUserObject(obj)) {
      canvas.bringObjectForward(obj);
      canvas.requestRenderAll();
    }
  };

  const sendBackward = () => {
    const obj = canvas.getActiveObject();
    if (obj && isUserObject(obj)) {
      canvas.sendObjectBackwards(obj);
      canvas.requestRenderAll();
    }
  };

  const flipSelected = (axis: "flipX" | "flipY") => {
    const targets = canvas.getActiveObjects().filter(isUserObject);
    if (!targets.length) return;
    targets.forEach((obj) => {
      obj.set(axis, !obj[axis]);
      obj.setCoords();
    });
    canvas.requestRenderAll();
    saveHistory();
    notifyDesignChange();
  };

  const flipHorizontal = () => flipSelected("flipX");
  const flipVertical = () => flipSelected("flipY");

  const getLayers = (): LayerInfo[] => {
    const objs = getUserObjects();
    return [...objs].reverse().map((obj, i) => {
      const { type, label } = getLayerLabel(obj);
      return {
        id: ensureLayerId(obj),
        stackIndex: objs.length - 1 - i,
        type,
        label: label.length > 24 ? `${label.slice(0, 24)}…` : label,
      };
    });
  };

  const selectLayer = (stackIndex: number) => {
    const obj = getUserObjects()[stackIndex];
    if (!obj) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    notifySelectionChange();
  };

  const moveLayerUp = (stackIndex: number) => {
    const obj = getUserObjects()[stackIndex];
    if (!obj) return;
    canvas.bringObjectForward(obj);
    canvas.requestRenderAll();
    saveHistory();
    notifyDesignChange();
  };

  const moveLayerDown = (stackIndex: number) => {
    const obj = getUserObjects()[stackIndex];
    if (!obj) return;
    canvas.sendObjectBackwards(obj);
    canvas.requestRenderAll();
    saveHistory();
  };

  const deleteLayer = (stackIndex: number) => {
    const obj = getUserObjects()[stackIndex];
    if (!obj) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    saveHistory();
    notifyDesignChange();
  };

  const clearDesign = () => {
    getUserObjects().forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    saveHistory();
    notifySelectionChange();
  };

  const undo = () => {
    const state = history.undo();
    if (state !== null) void loadUserObjects(state);
  };

  const redo = () => {
    const state = history.redo();
    if (state !== null) void loadUserObjects(state);
  };

  const focus = () => {
    (el.parentElement as HTMLElement | null)?.focus?.();
  };

  const dispose = () => {
    mockupGen++;
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    canvas.dispose();
  };

  return {
    canvas,
    handle: {
      exportJson,
      importJson,
      addText,
      addImageFromFile,
      deleteSelected,
      bringForward,
      sendBackward,
      flipHorizontal,
      flipVertical,
      getLayers,
      selectLayer,
      moveLayerUp,
      moveLayerDown,
      deleteLayer,
      clearDesign,
      updateMockup,
      undo,
      redo,
      focus,
      getJsonString: () => JSON.stringify(exportJson(), null, 2),
      checkOutOfBounds: () => false,
      dispose,
      getSelectionState,
      updateTextStyle,
      updateImageStyle,
      nudgeSelected,
      centerSelected,
    },
  };
}
