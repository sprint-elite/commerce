"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, PanelLeft } from "lucide-react";
import { DesignCanvas, type DesignCanvasRef } from "./DesignCanvas";
import { BuilderTopToolbar } from "./BuilderTopToolbar";
import { CanvasFloatingTools } from "./CanvasFloatingTools";
import { CanvasViewToggle } from "./CanvasViewToggle";
import { OrderPanel } from "./OrderPanel";
import { JsonModal } from "./WorkOrderPreview";
import { LeftSidebar } from "./LeftSidebar";
import { AnnotationPins } from "./AnnotationPins";
import { AnnotationMemoModal } from "./AnnotationMemoModal";
import { LayerPanelModal } from "./LayerPanelModal";
import {
  OrderLoadButton,
  OrderLoadModal,
} from "./OrderLoadModal";
import {
  OrderConfirmModal,
  type OrderConfirmData,
} from "./OrderConfirmModal";
import {
  ProductChangeModal,
  type BuilderProductOption,
} from "./ProductChangeModal";
import { useAuth } from "@/hooks/useAuth";
import { useBuilderStore } from "@/store";
import { calculatePrice, type PricingContext } from "@/lib/pricing";
import {
  exportBuilderPayload,
  productSlugFromType,
} from "@/lib/saved-design";
import { safeAdminReturnTo } from "@/lib/admin-builder";
import type { OrderShippingInput } from "@/lib/order-shipping";
import { embedImagesInDesignState, embedImagesInDesignJson } from "@/lib/fabric/image-persist";
import { getProductTitle } from "@/lib/fabric/mockup-builder";
import type { ProductType } from "@/types/builder";
import type { CanvasSelectionState } from "@/types/text-style";
import {
  BuilderProductProvider,
  type BuilderProductContextValue,
} from "./BuilderProductContext";
const PRODUCT_TYPES = new Set<ProductType>(["ecobag", "shopping-bag", "pouch"]);

const EMPTY_SELECTION: CanvasSelectionState = { kind: "none" };
const LEFT_SIDEBAR_W = 300;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

interface BuilderPageProps {
  initialProductSlug?: string;
  productTitle?: string;
  productType?: ProductType;
  /** 상품 상세 페이지에 임베드될 때: 카드 안 고정 높이, 헤더 숨김 */
  embedded?: boolean;
  /** DB 상품 정보 (상세 페이지에서 전달) */
  productContext?: BuilderProductContextValue;
}

export function BuilderPage({
  initialProductSlug,
  productTitle,
  productType: productTypeProp,
  embedded = false,
  productContext,
}: BuilderPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<DesignCanvasRef>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });
  const [jsonModalContent, setJsonModalContent] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [designRevision, setDesignRevision] = useState(0);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [showOrderLoadModal, setShowOrderLoadModal] = useState(false);
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false);
  const [orderConfirmData, setOrderConfirmData] =
    useState<OrderConfirmData | null>(null);
  const [productChangeOpen, setProductChangeOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<"select" | "change">(
    "change",
  );
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(
    null,
  );
  const [selectionState, setSelectionState] =
    useState<CanvasSelectionState>(EMPTY_SELECTION);
  const [showPrintAreaGuide, setShowPrintAreaGuide] = useState(true);
  const { user, logout } = useAuth();
  const loadSavedPayload = useBuilderStore((s) => s.loadSavedPayload);
  const loadedOrderNumber = useBuilderStore((s) => s.loadedOrderNumber);
  const loadedOrderId = useBuilderStore((s) => s.loadedOrderId);
  const startNewOrder = useBuilderStore((s) => s.startNewOrder);
  const resetForNewProduct = useBuilderStore((s) => s.resetForNewProduct);
  const setOrderLink = useBuilderStore((s) => s.setOrderLink);
  const setOption = useBuilderStore((s) => s.setOption);

  const adminReturnTo = safeAdminReturnTo(searchParams.get("returnTo"));
  const isAdminEdit =
    !embedded &&
    (searchParams.get("from") === "admin" || !!adminReturnTo);
  const adminExitHref = adminReturnTo ?? "/admin/orders";

  const goBackToAdmin = useCallback(() => {
    router.push(adminExitHref);
  }, [router, adminExitHref]);

  useEffect(() => {
    if (isAdminEdit) return;
    if (typeof window !== "undefined") {
      const order = new URLSearchParams(window.location.search).get("order");
      if (order) return;
      try {
        if (sessionStorage.getItem("jh-skip-product-modal") === "1") {
          sessionStorage.removeItem("jh-skip-product-modal");
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setProductModalMode("select");
    setProductChangeOpen(true);
  }, [isAdminEdit]);

  const openProductChange = useCallback(() => {
    setProductModalMode("change");
    setProductChangeOpen(true);
  }, []);

  const embeddedProductKey = embedded
    ? `${initialProductSlug ?? productTypeProp ?? ""}`
    : null;

  const standaloneProductKey = !embedded
    ? (initialProductSlug ??
        productContext?.slug ??
        searchParams.get("product") ??
        "ecobag")
    : null;

  useLayoutEffect(() => {
    if (!embedded || !embeddedProductKey) return;

    const productType =
      productTypeProp ??
      (PRODUCT_TYPES.has(embeddedProductKey as ProductType)
        ? (embeddedProductKey as ProductType)
        : null);
    if (!productType) return;

    resetForNewProduct(productType, {
      quantity: productContext?.minQuantity ?? 1,
    });
    setDesignRevision((v) => v + 1);
  }, [
    embedded,
    embeddedProductKey,
    productTypeProp,
    productContext?.minQuantity,
    resetForNewProduct,
  ]);

  useLayoutEffect(() => {
    if (embedded || !standaloneProductKey) return;

    const productType =
      productTypeProp ??
      (PRODUCT_TYPES.has(standaloneProductKey as ProductType)
        ? (standaloneProductKey as ProductType)
        : null);
    if (!productType) return;

    resetForNewProduct(productType, {
      quantity: productContext?.minQuantity ?? 1,
    });
    setDesignRevision((v) => v + 1);
  }, [
    embedded,
    standaloneProductKey,
    productTypeProp,
    productContext?.minQuantity,
    resetForNewProduct,
  ]);

  useEffect(() => {
    if (embedded) return;

    const fromProp =
      productTypeProp ??
      (initialProductSlug && PRODUCT_TYPES.has(initialProductSlug as ProductType)
        ? (initialProductSlug as ProductType)
        : null);
    const fromQuery = searchParams.get("product");
    const product =
      fromProp ??
      (fromQuery && PRODUCT_TYPES.has(fromQuery as ProductType)
        ? (fromQuery as ProductType)
        : null);
    if (product) {
      setOption("productType", product);
    }
  }, [searchParams, setOption, initialProductSlug, productTypeProp, embedded]);

  const orderFromUrl = embedded ? null : searchParams.get("order");

  useEffect(() => {
    if (embedded) return;

    const orderId = orderFromUrl;
    if (!orderId || !user || !canvasReady) return;
    if (loadedOrderId === orderId) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = (await res.json()) as {
          order?: {
            id: string;
            orderNumber: string;
            productName: string;
            notes: string | null;
            shippingName: string | null;
            shippingPhone: string | null;
            shippingZip: string | null;
            shippingAddress: string | null;
            design: {
              id: string;
              builderJson: Parameters<typeof loadSavedPayload>[0];
            } | null;
          };
          error?: string;
        };

        if (!res.ok || !data.order?.design?.builderJson) return;

        const { order } = data;
        const slug = productSlugFromType(
          order.design!.builderJson.options.productType,
        );
        const productFromUrl = searchParams.get("product");
        if (
          initialProductSlug &&
          slug !== initialProductSlug
        ) {
          return;
        }
        if (
          !initialProductSlug &&
          productFromUrl &&
          productFromUrl !== slug
        ) {
          return;
        }

        if (!initialProductSlug) {
          setOption("productType", order.design!.builderJson.options.productType);
        }

        loadSavedPayload(order.design!.builderJson, {
          id: order.design!.id,
          title: order.productName,
          orderId: order.id,
          orderNumber: order.orderNumber,
          notes: order.notes ?? "",
          shippingName: order.shippingName ?? "",
          shippingPhone: order.shippingPhone ?? "",
          shippingZip: order.shippingZip ?? "",
          shippingAddress: order.shippingAddress ?? "",
        });

        if (!cancelled) {
          setDesignRevision((v) => v + 1);
          setOrderSuccessMessage(
            `"${order.orderNumber}" 주문 작업물을 불러왔습니다.`,
          );
        }
      } catch {
        /* URL 주문 로드 실패 시 무시 */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    orderFromUrl,
    user,
    canvasReady,
    loadedOrderId,
    initialProductSlug,
    loadSavedPayload,
    searchParams,
    setOption,
    embedded,
  ]);

  const options = useBuilderStore((s) => s.options);
  const currentSide = useBuilderStore((s) => s.currentSide);
  const setCurrentSide = useBuilderStore((s) => s.setCurrentSide);
  const designData = useBuilderStore((s) => s.designData);
  const annotationMode = useBuilderStore((s) => s.annotationMode);
  const saveCurrentDesign = useBuilderStore((s) => s.saveCurrentDesign);
  const setPendingPin = useBuilderStore((s) => s.setPendingPin);
  const showJsonModal = useBuilderStore((s) => s.showJsonModal);
  const setShowJsonModal = useBuilderStore((s) => s.setShowJsonModal);

  useEffect(() => {
    const faces = productContext?.mockupFaces;
    if (!faces?.length) return;
    const sides = faces.map((f) => f.side);
    if (!sides.includes(currentSide)) {
      setCurrentSide(sides[0]!);
    }
  }, [productContext?.mockupFaces, currentSide, setCurrentSide]);

  const handleDesignChange = useCallback(() => {
    setDesignRevision((v) => v + 1);
  }, []);

  const handleDimsChange = useCallback((dims: { w: number; h: number }) => {
    setCanvasDims(dims);
  }, []);

  const persistCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    const json = canvasRef.current.exportJson();
    const embedded = (await embedImagesInDesignJson(json)) ?? json;
    saveCurrentDesign(currentSide, embedded);
  }, [currentSide, saveCurrentDesign]);

  const buildOrderConfirmData = useCallback(
    (mode: "create" | "update"): OrderConfirmData | null => {
      if (!canvasRef.current) return null;

      saveCurrentDesign(currentSide, canvasRef.current.exportJson());
      const state = useBuilderStore.getState();
      const pricingCtx: PricingContext | undefined = productContext
        ? {
            basePrice: productContext.basePrice,
            quantityDiscounts: productContext.quantityDiscounts,
          }
        : undefined;
      const price = calculatePrice(state.options, pricingCtx);

      return {
        title: productContext?.name ?? getProductTitle(state.options),
        options: state.options,
        unitPrice: price.unitPrice,
        totalPrice: price.totalPrice,
        mode,
        orderNumber: mode === "update" ? state.loadedOrderNumber : undefined,
        initialShipping: {
          shippingName:
            state.loadedShippingName || (user?.name ?? ""),
          shippingPhone: state.loadedShippingPhone,
          shippingAddress: state.loadedShippingAddress,
          shippingZip: state.loadedShippingZip,
          notes: state.loadedOrderNotes,
        },
      };
    },
    [currentSide, saveCurrentDesign, productContext, user?.name],
  );

  const openOrderConfirm = useCallback(
    (mode: "create" | "update") => {
      if (!user) {
        const next =
          embedded && initialProductSlug
            ? `/products/${initialProductSlug}`
            : "/builder";
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      if (mode === "update" && !useBuilderStore.getState().loadedOrderId) {
        return;
      }

      const data = buildOrderConfirmData(mode);
      if (!data) return;

      setOrderSuccessMessage(null);
      setOrderConfirmData(data);
      setOrderConfirmOpen(true);
    },
    [user, router, buildOrderConfirmData, embedded, initialProductSlug],
  );

  const handleOrderClick = useCallback(() => {
    openOrderConfirm("create");
  }, [openOrderConfirm]);

  const handleUpdateClick = useCallback(() => {
    openOrderConfirm("update");
  }, [openOrderConfirm]);

  const buildOrderPayload = useCallback(async () => {
    if (!canvasRef.current) return null;
    saveCurrentDesign(currentSide, canvasRef.current.exportJson());
    const state = useBuilderStore.getState();
    const designData = await embedImagesInDesignState({
      ...state.designData,
      [currentSide]: canvasRef.current.exportJson(),
    });
    return exportBuilderPayload({
      orderNo: state.orderNo,
      options: state.options,
      currentSide: state.currentSide,
      designData,
      annotations: state.annotations,
      mockupOffsets: state.mockupOffsets,
      approvalStatus: state.approvalStatus,
    });
  }, [currentSide, saveCurrentDesign]);

  const handleOrderConfirm = useCallback(
    async (shipping: OrderShippingInput) => {
      if (!canvasRef.current) return;
      setSubmittingOrder(true);

      try {
        const payload = await buildOrderPayload();
        if (!payload) return;

        const state = useBuilderStore.getState();
        const isUpdate = orderConfirmData?.mode === "update";
        const orderId = state.loadedOrderId;

        const res = await fetch(
          isUpdate && orderId ? `/api/orders/${orderId}` : "/api/orders",
          {
            method: isUpdate && orderId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              builderJson: payload,
              productSlug:
                productContext?.slug ??
                initialProductSlug ??
                undefined,
              shippingName: shipping.shippingName,
              shippingPhone: shipping.shippingPhone,
              shippingAddress: shipping.shippingAddress,
              shippingZip: shipping.shippingZip || undefined,
              notes: shipping.notes || undefined,
              ...(isUpdate
                ? {}
                : {
                    savedDesignId: state.savedDesignId,
                  }),
            }),
          },
        );

        const data = (await res.json()) as {
          order?: {
            id: string;
            orderNumber: string;
            productName: string;
            designId: string | null;
            notes: string | null;
            shippingName: string | null;
            shippingPhone: string | null;
            shippingZip: string | null;
            shippingAddress: string | null;
          };
          error?: string;
        };

        if (!res.ok) {
          throw new Error(
            data.error ??
              (isUpdate ? "주문 수정에 실패했습니다." : "주문에 실패했습니다."),
          );
        }

        if (data.order) {
          setOrderLink({
            designId: data.order.designId,
            orderId: data.order.id,
            orderNumber: data.order.orderNumber,
            title: data.order.productName,
            notes: data.order.notes ?? shipping.notes,
            shippingName:
              data.order.shippingName ?? shipping.shippingName,
            shippingPhone:
              data.order.shippingPhone ?? shipping.shippingPhone,
            shippingZip: data.order.shippingZip ?? shipping.shippingZip,
            shippingAddress:
              data.order.shippingAddress ?? shipping.shippingAddress,
          });
        }

        setOrderConfirmOpen(false);
        setOrderConfirmData(null);

        if (isAdminEdit && isUpdate) {
          setOrderSuccessMessage(
            `주문이 수정되었습니다. (${data.order?.orderNumber ?? ""})`,
          );
          router.push(adminExitHref);
          return;
        }

        if (!isUpdate && data.order?.id) {
          router.push(`/mypage/orders/${data.order.id}`);
          return;
        }

        setOrderSuccessMessage(
          isUpdate
            ? `주문이 수정되었습니다. (${data.order?.orderNumber ?? ""})`
            : `주문이 완료되었습니다. (${data.order?.orderNumber ?? ""})`,
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : "처리에 실패했습니다.");
      } finally {
        setSubmittingOrder(false);
      }
    },
    [
      buildOrderPayload,
      orderConfirmData?.mode,
      setOrderLink,
      isAdminEdit,
      adminExitHref,
      router,
      productContext?.slug,
      initialProductSlug,
    ],
  );

  const handleStartNewOrder = useCallback(() => {
    if (
      loadedOrderNumber &&
      !confirm(
        "신규 주문을 시작하면 현재 작업이 초기화되고 불러온 주문 연결이 해제됩니다. 계속할까요?",
      )
    ) {
      return;
    }

    startNewOrder();
    canvasRef.current?.clearDesign();
    setDesignRevision((v) => v + 1);
    setOrderSuccessMessage(null);
    setOrderConfirmOpen(false);
    setOrderConfirmData(null);
  }, [loadedOrderNumber, startNewOrder]);

  const handleClear = () => {
    canvasRef.current?.clearDesign();
  };

  const currentProductSlug =
    productContext?.slug ??
    initialProductSlug ??
    searchParams.get("product") ??
    null;

  const handleProductSelect = useCallback(
    (product: BuilderProductOption) => {
      if (product.slug === currentProductSlug) {
        setProductChangeOpen(false);
        return;
      }

      const hasWork =
        Object.values(useBuilderStore.getState().designData).some((side) => {
          if (!side || typeof side !== "object") return false;
          const objects = (side as { objects?: unknown[] }).objects;
          return Array.isArray(objects) && objects.length > 0;
        }) || Boolean(useBuilderStore.getState().loadedOrderId);

      if (
        hasWork &&
        !confirm(
          "상품을 바꾸면 현재 작업 내용이 초기화됩니다. 계속할까요?",
        )
      ) {
        return;
      }

      setProductChangeOpen(false);
      try {
        sessionStorage.setItem("jh-skip-product-modal", "1");
      } catch {
        /* ignore */
      }
      const href = embedded
        ? `/products/${product.slug}`
        : `/builder?product=${encodeURIComponent(product.slug)}`;
      router.push(href);
    },
    [currentProductSlug, embedded, router],
  );

  const handleAnnotationPlace = useCallback(
    (x: number, y: number) => {
      setPendingPin({ side: currentSide, x, y });
    },
    [currentSide, setPendingPin],
  );

  const toggleLeftSidebar = () => setLeftSidebarOpen((v) => !v);

  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setLeftSidebarOpen(false);
    }
  }, []);

  const clampZoom = useCallback(
    (value: number) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 10) / 10)),
    [],
  );

  const handleZoomIn = () => setCanvasZoom((z) => clampZoom(z + ZOOM_STEP));
  const handleZoomOut = () => setCanvasZoom((z) => clampZoom(z - ZOOM_STEP));
  const handleZoomReset = () => setCanvasZoom(1);

  const handleCanvasWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setCanvasZoom((z) => clampZoom(z + delta));
    },
    [clampZoom],
  );

  const toolbarTrailing = !embedded ? undefined : (
    <div className="flex items-center gap-1.5">
      {embedded && !isAdminEdit && (
        <OrderLoadButton
          onOpen={() => {
            persistCanvas();
            setShowOrderLoadModal(true);
          }}
          onStartNew={handleStartNewOrder}
          loadedOrderNumber={loadedOrderNumber || undefined}
        />
      )}
      {embedded && (
        <button
          type="button"
          onClick={toggleLeftSidebar}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 lg:hidden"
        >
          작업 요청
        </button>
      )}
      {embedded && (
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 lg:hidden"
        >
          옵션
        </button>
      )}
    </div>
  );

  return (
    <BuilderProductProvider value={productContext ?? null}>
    <div
      className={
        embedded
          ? "flex h-[min(85dvh,920px)] min-h-[420px] flex-col overflow-hidden bg-white sm:min-h-[560px] lg:min-h-[700px]"
          : "flex h-screen flex-col bg-white"
      }
    >
      {!embedded && (
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-5">
        <div className="flex min-w-0 items-center gap-2">
          {isAdminEdit ? (
            <button
              type="button"
              onClick={goBackToAdmin}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              관리자로 돌아가기
            </button>
          ) : (
            <Link
              href="/"
              className="shrink-0 text-lg font-black tracking-tight text-zinc-900"
            >
              JH MAKER
            </Link>
          )}
          {productTitle && (
            <>
              <span className="text-zinc-300">/</span>
              <span className="truncate text-sm font-semibold text-zinc-700">
                {productTitle}
              </span>
            </>
          )}
          {isAdminEdit && loadedOrderNumber && (
            <span className="hidden truncate font-mono text-xs text-slate-500 sm:inline">
              {loadedOrderNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isAdminEdit && (
            <OrderLoadButton
              onOpen={() => {
                persistCanvas();
                setShowOrderLoadModal(true);
              }}
              onStartNew={handleStartNewOrder}
              loadedOrderNumber={loadedOrderNumber || undefined}
            />
          )}
          {user ? (
            <>
              <span className="hidden text-xs text-zinc-500 sm:inline">
                {user.name}
                {isAdminEdit ? " · 관리자 수정" : ""}
              </span>
              {!isAdminEdit && (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  로그아웃
                </button>
              )}
            </>
          ) : (
            <Link
              href="/login?next=/builder"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              로그인
            </Link>
          )}
          <button
            type="button"
            onClick={toggleLeftSidebar}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 lg:hidden"
          >
            작업요청
          </button>
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 lg:hidden"
          >
            옵션
          </button>
        </div>
      </header>
      )}

      {orderSuccessMessage && (
        <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-2 text-sm text-emerald-800">
          <span>{orderSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setOrderSuccessMessage(null)}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            닫기
          </button>
        </div>
      )}

      <BuilderTopToolbar
        canvasRef={canvasRef}
        disabled={!canvasReady || annotationMode}
        onClear={handleClear}
        layersOpen={showLayerModal}
        onOpenLayers={() => setShowLayerModal((v) => !v)}
        canvasZoom={canvasZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        selectionState={selectionState}
        showPrintAreaGuide={showPrintAreaGuide}
        onShowPrintAreaGuideChange={setShowPrintAreaGuide}
        trailing={toolbarTrailing}
      />

      <div className="relative flex min-h-0 flex-1">
          <>
            <div
              className={`hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:block ${
                leftSidebarOpen ? "w-[300px]" : "w-0"
              }`}
            >
              <div className="h-full" style={{ width: LEFT_SIDEBAR_W }}>
                <LeftSidebar
                  orderId={loadedOrderId}
                  orderNumber={loadedOrderNumber || undefined}
                />
              </div>
            </div>

            <div
              className={`${
                leftSidebarOpen ? "fixed inset-0 z-40 flex lg:hidden" : "hidden"
              }`}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/30"
                onClick={() => setLeftSidebarOpen(false)}
              />
              <div className="relative z-10 h-full shadow-xl">
                <LeftSidebar
                  orderId={loadedOrderId}
                  orderNumber={loadedOrderNumber || undefined}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={toggleLeftSidebar}
              title={leftSidebarOpen ? "작업 요청 닫기" : "작업 요청 열기"}
              className="absolute top-1/2 z-30 hidden -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-zinc-200 bg-white py-3 pl-1 pr-1.5 shadow-md transition-[left] duration-300 ease-in-out hover:bg-zinc-50 lg:flex"
              style={{ left: leftSidebarOpen ? LEFT_SIDEBAR_W : 0 }}
            >
              {leftSidebarOpen ? (
                <ChevronLeft className="h-4 w-4 text-zinc-600" />
              ) : (
                <PanelLeft className="h-4 w-4 text-zinc-600" />
              )}
            </button>
          </>

        <main
          className={`relative min-w-0 flex-1 overflow-auto ${
            embedded ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"
          }`}
          onWheel={handleCanvasWheel}
        >
          <div
            className="relative min-h-full min-w-full"
            style={
              canvasDims.w > 0 && canvasDims.h > 0
                ? {
                    width: canvasDims.w * canvasZoom,
                    height: canvasDims.h * canvasZoom,
                  }
                : undefined
            }
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={
                canvasDims.w > 0 && canvasDims.h > 0
                  ? {
                      width: canvasDims.w,
                      height: canvasDims.h,
                      transform: `scale(${canvasZoom})`,
                    }
                  : { inset: 0, width: "100%", height: "100%" }
              }
            >
              <DesignCanvas
                ref={canvasRef}
                options={options}
                side={currentSide}
                designJson={designData[currentSide]}
                showPrintAreaGuide={showPrintAreaGuide}
                onReady={() => setCanvasReady(true)}
                onDimsChange={handleDimsChange}
                onDesignChange={handleDesignChange}
                onSelectionChange={setSelectionState}
                annotationMode={annotationMode}
                onAnnotationPlace={handleAnnotationPlace}
              />
              <AnnotationPins
                canvasWidth={canvasDims.w}
                canvasHeight={canvasDims.h}
              />
            </div>
          </div>
          {!annotationMode && (
            <CanvasFloatingTools
              canvasRef={canvasRef}
              disabled={!canvasReady}
              onProductChange={openProductChange}
              onDesignClick={() => setShowLayerModal(true)}
            />
          )}
          <CanvasViewToggle canvasRef={canvasRef} />
        </main>

        <aside
          className={`${
            showOptions ? "fixed inset-0 z-40 flex lg:relative lg:inset-auto" : "hidden"
          } w-full shrink-0 bg-white lg:flex ${
            embedded
              ? "lg:w-[440px] lg:shadow-[-8px_0_30px_rgba(0,0,0,0.06)]"
              : "border-l border-zinc-200 lg:w-[300px]"
          }`}
        >
          {showOptions && (
            <button
              type="button"
              className="absolute inset-0 bg-black/30 lg:hidden"
              onClick={() => setShowOptions(false)}
            />
          )}
          <div
            className={`relative z-10 ml-auto flex h-full flex-col bg-white shadow-xl lg:ml-0 lg:w-full lg:shadow-none ${
              embedded ? "w-[min(100%,440px)]" : "w-[300px]"
            }`}
          >
            <OrderPanel
              compact={embedded || !!productContext}
              adminEdit={isAdminEdit}
              onOrder={isAdminEdit ? undefined : handleOrderClick}
              onUpdate={handleUpdateClick}
              ordering={submittingOrder}
              loadedOrderNumber={loadedOrderNumber || undefined}
            />
          </div>
        </aside>
      </div>

      <LayerPanelModal
        open={showLayerModal}
        canvasRef={canvasRef}
        designRevision={designRevision}
        onClose={() => setShowLayerModal(false)}
      />
      <AnnotationMemoModal />

      <JsonModal
        open={showJsonModal}
        json={jsonModalContent}
        onClose={() => setShowJsonModal(false)}
      />

      <OrderLoadModal
        open={showOrderLoadModal}
        onClose={() => setShowOrderLoadModal(false)}
        user={user}
        onPersistCanvas={persistCanvas}
        onLoaded={() => setDesignRevision((v) => v + 1)}
      />

      <OrderConfirmModal
        open={orderConfirmOpen}
        data={orderConfirmData}
        submitting={submittingOrder}
        onClose={() => {
          if (submittingOrder) return;
          setOrderConfirmOpen(false);
          setOrderConfirmData(null);
        }}
        onConfirm={handleOrderConfirm}
      />

      <ProductChangeModal
        open={productChangeOpen}
        currentSlug={currentProductSlug}
        mode={productModalMode}
        onClose={() => setProductChangeOpen(false)}
        onSelect={handleProductSelect}
      />
    </div>
    </BuilderProductProvider>
  );
}
