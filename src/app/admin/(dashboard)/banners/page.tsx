import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminBannerManager } from "@/components/admin/AdminBannerManager";

export default async function AdminBannersPage() {
  await requireAdmin();
  const banners = await prisma.banner.findMany({
    orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <AdminBannerManager
      initialBanners={banners.map((b) => ({
        id: b.id,
        placement: b.placement,
        tag: b.tag,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
        sortOrder: b.sortOrder,
        isActive: b.isActive,
      }))}
    />
  );
}
