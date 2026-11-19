import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { calculatePrice } from "@/lib/pricing";
import { getProductTitle } from "@/lib/fabric/mockup-builder";
import {
  fetchOrdersForAdmin,
  fetchOrdersForUser,
  generateOrderNumber,
  toOrderDto,
} from "@/lib/orders";
import { parseBuilderPayload } from "@/lib/saved-design";
import { earnPointsForOrder } from "@/lib/points";
import {
  normalizeShippingInput,
  validateShippingInput,
} from "@/lib/order-shipping";
import { resolveCatalogProduct } from "@/lib/resolve-product";
import { assertApiRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const user = await requireUser();

    const orders =
      user.role === "ADMIN"
        ? await fetchOrdersForAdmin()
        : await fetchOrdersForUser(user.id);

    return NextResponse.json({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "orders-create");
    const user = await requireUser();
    const body = (await request.json()) as {
      builderJson?: unknown;
      savedDesignId?: string;
      productSlug?: string;
      notes?: string;
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
      shippingZip?: string;
    };

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
      let designId: string | null = null;

      if (body.savedDesignId) {
        const existing = await tx.design.findFirst({
          where: { id: body.savedDesignId, userId: user.id },
        });
        if (existing) {
          const updated = await tx.design.update({
            where: { id: existing.id },
            data: {
              productId: product.id,
              builderJson: payload as unknown as Prisma.InputJsonValue,
            },
          });
          designId = updated.id;
        }
      }

      if (!designId) {
        const created = await tx.design.create({
          data: {
            userId: user.id,
            productId: product.id,
            title: productName,
            builderJson: payload as unknown as Prisma.InputJsonValue,
          },
        });
        designId = created.id;
      }

      const orderNumber = await generateOrderNumber(tx);

      return tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          productId: product.id,
          designId,
          quantity: payload.options.quantity,
          subtotal: price.subtotal,
          discountAmount: price.discountAmount,
          shippingFee,
          totalPrice: price.totalPrice,
          paymentStatus: "UNPAID",
          status: "PENDING",
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

    void earnPointsForOrder({
      userId: order.userId,
      orderId: order.id,
      orderTotal: order.totalPrice,
      orderNumber: order.orderNumber,
    });

    return NextResponse.json({ order: toOrderDto(order) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
