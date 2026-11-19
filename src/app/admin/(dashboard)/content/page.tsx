import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminContentManager } from "@/components/admin/AdminContentManager";
import {
  articlePath,
  parseContentArticleType,
} from "@/lib/content-article-types";

export default async function AdminContentPage() {
  await requireAdmin();
  const rows = await prisma.contentArticle.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <AdminContentManager
      initialArticles={rows.map((r) => ({
        id: r.id,
        type: r.type,
        slug: r.slug,
        title: r.title,
        subtitle: r.subtitle,
        coverImageUrl: r.coverImageUrl,
        cardTag: r.cardTag,
        cardGradient: r.cardGradient,
        introJson: r.introJson,
        sectionsJson: r.sectionsJson,
        faqJson: r.faqJson,
        publishedAt: r.publishedAt.toISOString(),
        sortOrder: r.sortOrder,
        isActive: r.isActive,
        href: articlePath(parseContentArticleType(r.type), r.slug),
      }))}
    />
  );
}
