import type {
  Order as PrismaOrder,
  Prisma,
  User,
  Product,
  OrderItem,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  fetchProductMockupFaces,
  type ProductMockupFaceDto,
} from "@/lib/product-mockup";
import { parseBuilderPayload } from "@/lib/saved-design";
import type { Order, OrderDetail } from "@/types";

export type OrderWithRelations = PrismaOrder & {
  user: Pick<User, "id" | "name" | "email">;
  product: Pick<Product, "id" | "name" | "slug" | "saleType">;
  items: OrderItem[];
  design?: {
    id: string;
    title: string;
    previewUrl: string | null;
    builderJson: unknown;
  } | null;
};

const orderInclude = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true, slug: true, saleType: true } },
  items: true,
} as const;

const orderDetailInclude = {
  ...orderInclude,
  design: {
    select: {
      id: true,
      title: true,
      previewUrl: true,
      builderJson: true,
    },
  },
} as const;

export function toOrderDto(order: OrderWithRelations): Order {
  const productName =
    order.items[0]?.productName ?? order.product.name;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.userId,
    customerName: order.user.name,
    customerEmail: order.user.email,
    productId: order.productId,
    productSlug: order.product.slug,
    productName,
    saleType: order.product.saleType,
    designId: order.designId,
    status: order.status as Order["status"],
    paymentStatus: order.paymentStatus as Order["paymentStatus"],
    quantity: order.quantity,
    shippingFee: order.shippingFee,
    discountAmount: order.discountAmount,
    couponDiscount: order.couponDiscount,
    pointsUsed: order.pointsUsed,
    totalPrice: order.totalPrice,
    notes: order.notes,
    shippingName: order.shippingName,
    shippingPhone: order.shippingPhone,
    shippingZip: order.shippingZip,
    shippingAddress: order.shippingAddress,
    trackingNumber: order.trackingNumber,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function generateOrderNumber(
  tx: Prisma.TransactionClient = prisma,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JH-${year}-`;

  const latest = await tx.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  let seq = 1;
  if (latest) {
    const part = latest.orderNumber.slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function fetchOrdersForAdmin(): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return orders.map(toOrderDto);
}

export async function fetchOrdersForUser(userId: string): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return orders.map(toOrderDto);
}

export function toOrderDetailDto(
  order: NonNullable<Awaited<ReturnType<typeof fetchOrderRecord>>>,
  mockupFaces: ProductMockupFaceDto[] = [],
): OrderDetail {
  const base = toOrderDto(order);
  const payload = order.design
    ? parseBuilderPayload(order.design.builderJson)
    : null;

  return {
    ...base,
    customerEmail: order.user.email,
    items: order.items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    mockupFaces,
    design:
      order.design && payload
        ? {
            id: order.design.id,
            title: order.design.title,
            previewUrl: order.design.previewUrl,
            builderJson: payload,
          }
        : null,
  };
}

async function fetchOrderRecord(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: orderDetailInclude,
  });
}

export async function fetchOrderDetailById(
  id: string,
): Promise<OrderDetail | null> {
  const order = await fetchOrderRecord(id);
  if (!order) return null;
  const mockupFaces = await fetchProductMockupFaces(order.productId);
  return toOrderDetailDto(order, mockupFaces);
}
