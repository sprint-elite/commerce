import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { calculateReadyMadePrice } from "@/lib/pricing";
import { generateOrderNumber, toOrderDto } from "@/lib/orders";
import { earnPointsForOrder } from "@/lib/points";
import {
  normalizeShippingInput,
  validateShippingInput,
} from "@/lib/order-shipping";
import {
  assertStockAvailable,
  decrementStock,
} from "@/lib/inventory";
import { assertApiRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "orders-ready-made");
    const user = await requireUser();
    const body = (await request.json()) as {
      productSlug?: string;
      quantity?: number;
      notes?: string;
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
      shippingZip?: string;
    };

    const productSlug = body.productSlug?.trim();
    if (!productSlug) return jsonError("상품을 선택해 주세요.", 400);

    const shippingError = validateShippingInput(body);
    if (shippingError) return jsonError(shippingError, 400);
    const shipping = normalizeShippingInput(body);

    const product = await prisma.product.findFirst({
      where: { slug: productSlug, isActive: true },
      include: {
        quantityDiscounts: { orderBy: { minQuantity: "asc" } },
      },
    });
    if (!product) return jsonError("상품을 찾을 수 없습니다.", 404);
    if (product.saleType !== "READYMADE") {
      return jsonError("기성품만 이 경로로 주문할 수 있습니다.", 400);
    }

    const quantity = Math.round(Number(body.quantity) || product.minQuantity);
    if (quantity < product.minQuantity) {
      return jsonError(`최소 주문 수량은 ${product.minQuantity}개입니다.`, 400);
    }
    if (quantity > product.maxQuantity) {
      return jsonError(`최대 주문 수량은 ${product.maxQuantity}개입니다.`, 400);
    }

    const stockErr = assertStockAvailable(
      product.stockQuantity,
      quantity,
      product.name,
    );
    if (stockErr) return jsonError(stockErr, 400);

    const price = calculateReadyMadePrice(quantity, {
      basePrice: product.basePrice,
      quantityDiscounts: product.quantityDiscounts,
    });
    const shippingFee = 0;

    const order = await prisma.$transaction(async (tx) => {
      await decrementStock(product.id, quantity, tx);
      const orderNumber = await generateOrderNumber(tx);
      return tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          productId: product.id,
          designId: null,
          quantity,
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
              productName: product.name,
              quantity,
              unitPrice: price.unitPrice,
            },
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: {
            select: { id: true, name: true, slug: true, saleType: true },
          },
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
