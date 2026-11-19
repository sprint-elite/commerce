import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  fetchAdminCategories,
  type AdminProductDto,
} from "@/lib/admin-catalog";
import { isBuilderType } from "@/lib/builder-types";
import type { ProductType } from "@/types/builder";
import { AdminProductEditShell } from "@/components/admin/AdminProductEditShell";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminProductEditPage({
  params,
  searchParams,
}: Props) {
  await requireAdmin();
  const { id } = await params;
  const { tab } = await searchParams;

  const [row, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: {
          select: {
            mockupFaces: true,
            orders: true,
            designs: true,
            images: true,
            quantityDiscounts: true,
          },
        },
      },
    }),
    fetchAdminCategories(),
  ]);

  if (!row) notFound();

  const product: AdminProductDto = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDesc: row.shortDesc,
    description: row.description,
    basePrice: row.basePrice,
    minQuantity: row.minQuantity,
    maxQuantity: row.maxQuantity,
    stockQuantity: row.stockQuantity,
    thumbnailUrl: row.thumbnailUrl,
    saleType: row.saleType === "READYMADE" ? "READYMADE" : "CUSTOM",
    builderType: (isBuilderType(row.builderType)
      ? row.builderType
      : "ecobag") as ProductType,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    isNew: row.isNew,
    ratingAvg: row.ratingAvg,
    reviewCount: row.reviewCount,
    mockupFaceCount: row._count.mockupFaces,
    orderCount: row._count.orders,
    designCount: row._count.designs,
    imageCount: row._count.images,
    discountRuleCount: row._count.quantityDiscounts,
    optionSchema: row.optionSchema,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  return (
    <AdminProductEditShell
      product={product}
      categories={categories}
      initialTab={tab === "content" ? "content" : "basic"}
    />
  );
}
