import type { Canvas, FabricObject } from "fabric";
import type { ProductCanvasConfig } from "./product-canvas";
import { DEFAULT_BUILDER_FONT } from "@/lib/builder-fonts";

export interface FabricCanvasHandle {
  exportJson: () => string;
  importJson: (json: string) => Promise<void>;
  addText: (text?: string) => void;
  addRect: () => void;
  addImageFromFile: (file: File) => Promise<void>;
  deleteSelected: () => void;
  setActiveColor: (color: string) => void;
  clear: () => void;
  dispose: () => void;
}

let defaultFill = "#171717";

export async function createFabricCanvas(
  el: HTMLCanvasElement,
  config: ProductCanvasConfig,
): Promise<{ canvas: Canvas; handle: FabricCanvasHandle }> {
  const { Canvas, IText, Rect, FabricImage } = await import("fabric");

  const canvas = new Canvas(el, {
    width: config.width,
    height: config.height,
    backgroundColor: config.backgroundColor,
    preserveObjectStacking: true,
  });

  const guide = new Rect({
    left: 12,
    top: 12,
    width: config.width - 24,
    height: config.height - 24,
    fill: "transparent",
    stroke: "#d4d4d8",
    strokeDashArray: [6, 4],
    selectable: false,
    evented: false,
  });
  (guide as FabricObject & { jhGuide?: boolean }).jhGuide = true;
  canvas.add(guide);

  const exportJson = () => {
    const objects = canvas
      .getObjects()
      .filter((obj) => !(obj as FabricObject & { jhGuide?: boolean }).jhGuide);
    return JSON.stringify({
      objects: objects.map((obj) => obj.toObject()),
      background: canvas.backgroundColor as string,
    });
  };

  const importJson = async (json: string) => {
    const parsed = JSON.parse(json) as {
      objects?: Record<string, unknown>[];
      background?: string;
    };
    canvas.clear();
    if (parsed.background) {
      canvas.backgroundColor = parsed.background;
    }
    if (parsed.objects?.length) {
      const { util } = await import("fabric");
      const enlivened = await util.enlivenObjects(parsed.objects);
      enlivened.forEach((obj) => canvas.add(obj as FabricObject));
    }
    canvas.add(guide);
    canvas.requestRenderAll();
  };

  const addText = (text = "텍스트 입력") => {
    const item = new IText(text, {
      left: config.width / 2 - 60,
      top: config.height / 2 - 16,
      fontFamily: DEFAULT_BUILDER_FONT,
      fontSize: 28,
      fill: defaultFill,
    });
    canvas.add(item);
    canvas.setActiveObject(item);
    canvas.requestRenderAll();
  };

  const addRect = () => {
    const item = new Rect({
      left: config.width / 2 - 50,
      top: config.height / 2 - 40,
      width: 100,
      height: 80,
      fill: defaultFill,
      opacity: 0.85,
      rx: 4,
      ry: 4,
    });
    canvas.add(item);
    canvas.setActiveObject(item);
    canvas.requestRenderAll();
  };

  const addImageFromFile = async (file: File) => {
    const { fileToDataUrl } = await import("./image-persist");
    const dataUrl = await fileToDataUrl(file);
    const img = await FabricImage.fromURL(dataUrl);
    const maxW = config.width * 0.6;
    if (img.width && img.width > maxW) {
      img.scaleToWidth(maxW);
    }
    img.set({
      left: config.width / 2 - (img.getScaledWidth() ?? 0) / 2,
      top: config.height / 2 - (img.getScaledHeight() ?? 0) / 2,
    });
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
  };

  const deleteSelected = () => {
    const active = canvas.getActiveObjects();
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  };

  const setActiveColor = (color: string) => {
    defaultFill = color;
    const active = canvas.getActiveObject();
    if (active) {
      active.set("fill", color);
      canvas.requestRenderAll();
    }
  };

  const clear = () => {
    canvas.clear();
    canvas.backgroundColor = config.backgroundColor;
    canvas.add(guide);
    canvas.requestRenderAll();
  };

  const dispose = () => {
    canvas.dispose();
  };

  const handle: FabricCanvasHandle = {
    exportJson,
    importJson,
    addText,
    addRect,
    addImageFromFile,
    deleteSelected,
    setActiveColor,
    clear,
    dispose,
  };

  return { canvas, handle };
}
