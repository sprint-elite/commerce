import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { isOrderStatus } from "@/lib/order-status";
import { isPaymentStatus } from "@/lib/payment-status";
import { toOrderDto } from "@/lib/orders";
import { earnPointsForOrder } from "@/lib/points";
import { finalizeDiscountsOnPaid } from "@/lib/order-discounts";
import { notify } from "@/lib/notify";

type RouteContext = { params: Promise<{ id: string }> };

const orderInclude = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true, slug: true, saleType: true } },
  items: true,
} as const;

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: string;
      paymentStatus?: string;
      trackingNumber?: string | null;
    };

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return jsonError("주문을 찾을 수 없습니다.", 404);

    const data: {
      status?: typeof existing.status;
      paymentStatus?: typeof existing.paymentStatus;
      trackingNumber?: string | null;
      paidAt?: Date | null;
      shippedAt?: Date | null;
    } = {};

    if (body.status !== undefined) {
      if (!isOrderStatus(body.status)) {
        return jsonError("유효하지 않은 주문 상태입니다.", 400);
      }
      data.status = body.status;
      if (body.status === "SHIPPED" && !existing.shippedAt) {
        data.shippedAt = new Date();
      }
    }

    if (body.paymentStatus !== undefined) {
      if (!isPaymentStatus(body.paymentStatus)) {
        return jsonError("유효하지 않은 입금 상태입니다.", 400);
      }
      data.paymentStatus = body.paymentStatus;
      if (body.paymentStatus === "PAID") {
        data.paidAt = existing.paidAt ?? new Date();
        if (
          existing.status === "AWAITING_PAYMENT" ||
          existing.status === "PENDING"
        ) {
          data.status = "CONFIRMED";
        }
      } else if (body.paymentStatus === "UNPAID") {
        data.paidAt = null;
      }
    }

    if (body.trackingNumber !== undefined && body.status === undefined) {
      const tracking = body.trackingNumber?.trim() || null;
      data.trackingNumber = tracking;
      if (tracking && !existing.shippedAt) {
        data.shippedAt = new Date();
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: orderInclude,
    });

    const becamePaid =
      body.paymentStatus === "PAID" && existing.paymentStatus !== "PAID";
    if (becamePaid) {
      const unpaidPayment = await prisma.payment.findFirst({
        where: { orderId: order.id, status: "UNPAID" },
        orderBy: { createdAt: "desc" },
      });
      if (unpaidPayment) {
        await prisma.payment.update({
          where: { id: unpaidPayment.id },
          data: {
            status: "PAID",
            paidAt: order.paidAt ?? new Date(),
            method: order.paymentMethod ?? unpaidPayment.method,
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: order.paymentMethod ?? "BANK_TRANSFER",
            status: "PAID",
            amount: order.totalPrice,
            paidAt: order.paidAt ?? new Date(),
            transactionId: `admin_confirm_${Date.now()}`,
          },
        });
      }

      await finalizeDiscountsOnPaid({
        id: order.id,
        userId: order.userId,
        orderNumber: order.orderNumber,
        pointsUsed: order.pointsUsed,
        couponClaimId: order.couponClaimId,
      });
      void earnPointsForOrder({
        userId: order.userId,
        orderId: order.id,
        orderTotal: order.totalPrice,
        orderNumber: order.orderNumber,
      });
      void notify({
        type: "ORDER_PAID",
        toEmail: order.user.email,
        subject: `[JH MAKER] 입금 확인 ${order.orderNumber}`,
        body: `주문 ${order.orderNumber} 입금이 확인되었습니다.`,
        meta: { orderId: order.id },
      });
    }

    if (
      body.status === "SHIPPED" &&
      existing.status !== "SHIPPED" &&
      order.user.email
    ) {
      void notify({
        type: "ORDER_SHIPPED",
        toEmail: order.user.email,
        subject: `[JH MAKER] 작업 완료 ${order.orderNumber}`,
        body: `주문 ${order.orderNumber} 작업이 완료되었습니다.`,
        meta: { orderId: order.id },
      });
    }

    return NextResponse.json({ order: toOrderDto(order) });
  } catch (err) {
    return handleApiError(err);
  }
}
