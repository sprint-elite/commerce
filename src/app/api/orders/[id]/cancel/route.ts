import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { toOrderDto } from "@/lib/orders";
import { restoreStock } from "@/lib/inventory";

const CANCELLABLE = new Set(["PENDING", "AWAITING_PAYMENT"]);

type Ctx = { params: Promise<{ id: string }> };

/** 고객: 접수 단계 주문 취소 */
export async function POST(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: {
          select: { id: true, name: true, slug: true, saleType: true },
        },
        items: true,
      },
    });

    if (!order) return jsonError("주문을 찾을 수 없습니다.", 404);
    if (order.userId !== user.id) {
      return jsonError("접근 권한이 없습니다.", 403);
    }
    if (order.status === "CANCELLED") {
      return jsonError("이미 취소된 주문입니다.", 400);
    }
    if (!CANCELLABLE.has(order.status)) {
      return jsonError("제작이 진행된 주문은 취소할 수 없습니다.", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await restoreStock(item.productId, item.quantity, tx);
      }
      if (order.couponClaimId) {
        await tx.couponClaim.updateMany({
          where: { id: order.couponClaimId, usedAt: null },
          data: { orderId: null },
        });
      }
      return tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          couponClaimId: null,
          couponDiscount: 0,
          pointsUsed: 0,
          totalPrice:
            order.totalPrice + order.couponDiscount + order.pointsUsed,
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

    return NextResponse.json({ order: toOrderDto(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
