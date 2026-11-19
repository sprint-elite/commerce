import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminCollectionManager } from "@/components/admin/AdminCollectionManager";

export default async function AdminCollectionsPage() {
  await requireAdmin();
  const [collections, products] = await Promise.all([
    prisma.productCollection.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <AdminCollectionManager
      initialCollections={collections.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        type: c.type,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        items: c.items.map((i) => ({
          productId: i.productId,
          product: i.product,
        })),
      }))}
      products={products}
    />
  );
}
