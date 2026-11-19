import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { calculatePrice } from "@/lib/pricing";
import { getProductTitle } from "@/lib/fabric/mockup-builder";
import { fetchOrderDetailById, toOrderDto } from "@/lib/orders";
import { parseBuilderPayload } from "@/lib/saved-design";
import {
  normalizeShippingInput,
  validateShippingInput,
} from "@/lib/order-shipping";
import { resolveCatalogProduct } from "@/lib/resolve-product";

type RouteContext = { params: Promise<{ id: string }> };

const EDITABLE_STATUSES = new Set(["PENDING", "AWAITING_PAYMENT", "CONFIRMED"]);

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const order = await fetchOrderDetailById(id);
    if (!order) {
      return jsonError("주문을 찾을 수 없습니다.", 404);
    }

    if (user.role !== "ADMIN" && order.customerId !== user.id) {
      return jsonError("접근 권한이 없습니다.", 403);
    }

    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json()) as {
      builderJson?: unknown;
      productSlug?: string;
      notes?: string;
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
      shippingZip?: string;
    };

    const existing = await prisma.order.findFirst({
      where: {
        id,
        ...(user.role === "ADMIN" ? {} : { userId: user.id }),
      },
      include: { items: true },
    });

    if (!existing) {
      return jsonError("주문을 찾을 수 없습니다.", 404);
    }

    if (!EDITABLE_STATUSES.has(existing.status)) {
      return jsonError("제작이 시작된 주문은 수정할 수 없습니다.", 400);
    }

    const payload = parseBuilderPayload(body.builderJson);
    if (!payload) {
      return jsonError("주문 데이터가 올바르지 않습니다.", 400);
    }

    const shippingError = validateShippingInput(body);
    if (shippingError) {
      return jsonError(shippingError, 400);
    }
    const shipping = normalizeShippingInput(body);

    const product = await resolveCatalogProduct({
      productSlug: body.productSlug,
      builderType: payload.options.productType,
    });
    if (!product) {
      return jsonError("상품 정보를 찾을 수 없습니다.", 400);
    }

    const price = calculatePrice(payload.options, {
      basePrice: product.basePrice,
      quantityDiscounts: product.quantityDiscounts,
    });
    const shippingFee = 0;
    const productName = getProductTitle(payload.options);

    const order = await prisma.$transaction(async (tx) => {
      let designId = existing.designId;

      if (designId) {
        const design = await tx.design.findFirst({
          where: {
            id: designId,
            userId: existing.userId,
          },
        });
        if (design) {
          await tx.design.update({
            where: { id: design.id },
            data: {
              productId: product.id,
              title: productName,
              builderJson: payload as unknown as Prisma.InputJsonValue,
            },
          });
        } else {
          designId = null;
        }
      }

      if (!designId) {
        const created = await tx.design.create({
          data: {
            userId: existing.userId,
            productId: product.id,
            title: productName,
            builderJson: payload as unknown as Prisma.InputJsonValue,
          },
        });
        designId = created.id;
      }

      await tx.orderItem.deleteMany({ where: { orderId: id } });

      return tx.order.update({
        where: { id },
        data: {
          productId: product.id,
          designId,
          quantity: payload.options.quantity,
          subtotal: price.subtotal,
          discountAmount: price.discountAmount,
          shippingFee,
          totalPrice: price.totalPrice,
          notes: shipping.notes,
          shippingName: shipping.shippingName,
          shippingPhone: shipping.shippingPhone,
          shippingZip: shipping.shippingZip,
          shippingAddress: shipping.shippingAddress,
          items: {
            create: {
              productId: product.id,
              productName,
              quantity: payload.options.quantity,
              unitPrice: price.unitPrice,
            },
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true, saleType: true } },
          items: true,
        },
      });
    });

    return NextResponse.json({ order: toOrderDto(order) });
  } catch (err) {
    return handleApiError(err);
  }
}
