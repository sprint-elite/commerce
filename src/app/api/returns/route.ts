import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { isReturnEligibleOrderStatus } from "@/lib/returns";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await prisma.returnRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderNumber: true, product: { select: { name: true } } } },
      },
      take: 50,
    });
    return NextResponse.json({
      returns: rows.map((r) => ({
        id: r.id,
        type: r.type,
        reason: r.reason,
        status: r.status,
        adminNote: r.adminNote,
        orderId: r.orderId,
        orderNumber: r.order.orderNumber,
        productName: r.order.product.name,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      orderId?: string;
      type?: string;
      reason?: string;
    };
    const orderId = body.orderId?.trim();
    const type = body.type === "EXCHANGE" ? "EXCHANGE" : "RETURN";
    const reason = body.reason?.trim() ?? "";
    if (!orderId || reason.length < 5) {
      return jsonError("주문과 사유(5자 이상)를 입력해 주세요.", 400);
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id) {
      return jsonError("주문을 찾을 수 없습니다.", 404);
    }
    if (!isReturnEligibleOrderStatus(order.status)) {
      return jsonError(
        "제작·배송이 진행된 주문만 교환·반품을 신청할 수 있습니다.",
        400,
      );
    }

    const existing = await prisma.returnRequest.findFirst({
      where: { orderId, userId: user.id, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (existing) {
      return jsonError("이미 진행 중인 신청이 있습니다.", 409);
    }

    const row = await prisma.returnRequest.create({
      data: { orderId, userId: user.id, type, reason },
    });

    return NextResponse.json(
      {
        returnRequest: {
          id: row.id,
          type: row.type,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
