import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { slug } = await context.params;
    const body = (await request.json()) as {
      rating?: number;
      content?: string;
      title?: string;
      orderId?: string;
    };

    const rating = Math.round(Number(body.rating));
    const content = body.content?.trim() ?? "";
    if (rating < 1 || rating > 5) {
      return jsonError("별점은 1~5점이어야 합니다.", 400);
    }
    if (content.length < 5) {
      return jsonError("리뷰 내용을 5자 이상 입력해 주세요.", 400);
    }

    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
    });
    if (!product) return jsonError("상품을 찾을 수 없습니다.", 404);

    const eligibleOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        status: { not: "CANCELLED" },
        ...(body.orderId ? { id: body.orderId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    // 멀티 상품 주문: order items에도 포함될 수 있음
    const eligibleViaItem =
      eligibleOrder ??
      (await prisma.order.findFirst({
        where: {
          userId: user.id,
          status: { not: "CANCELLED" },
          items: { some: { productId: product.id } },
        },
        orderBy: { createdAt: "desc" },
      }));

    if (!eligibleViaItem) {
      return jsonError("주문한 상품만 리뷰할 수 있습니다.", 403);
    }

    const existing = await prisma.productReview.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        orderId: eligibleViaItem.id,
      },
    });
    if (existing) {
      return jsonError("이미 이 주문에 대한 리뷰를 작성했습니다.", 400);
    }

    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        userId: user.id,
        orderId: eligibleViaItem.id,
        rating,
        title: body.title?.trim() || null,
        content,
        isVisible: true,
      },
    });

    const agg = await prisma.productReview.aggregate({
      where: { productId: product.id, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        reviewCount: agg._count._all,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
