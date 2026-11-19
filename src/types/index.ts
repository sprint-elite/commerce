import type { ProductMockupFaceDto } from "@/lib/product-mockup";
import type { SavedBuilderPayload } from "./saved-design";
import type { ProductSaleType } from "@/lib/product-sale-type";
import type { PaymentStatus } from "@/lib/payment-status";

export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type UserRole = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  emailVerifiedAt: string | null;
  pointsBalance: number;
  isGuest: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  thumbnailUrl: string | null;
  isActive: boolean;
}

export interface Design {
  id: string;
  productId: string;
  /** Fabric.js canvas JSON — 추후 DB에 저장 */
  canvasJson: string | null;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productSlug: string;
  productName: string;
  saleType: ProductSaleType;
  designId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  quantity: number;
  shippingFee?: number;
  discountAmount?: number;
  couponDiscount?: number;
  pointsUsed?: number;
  totalPrice: number;
  notes: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingZip: string | null;
  shippingAddress: string | null;
  trackingNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDetail extends Order {
  customerEmail: string;
  items: OrderItem[];
  mockupFaces: ProductMockupFaceDto[];
  design: {
    id: string;
    title: string;
    previewUrl: string | null;
    builderJson: SavedBuilderPayload;
  } | null;
}

export interface OrderComment {
  id: string;
  orderId: string;
  userId: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
}
