import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_CASE_ARTICLES,
  toPrismaCreateData,
} from "../src/lib/content-article";

async function main() {
  const prisma = new PrismaClient();
  for (const payload of DEFAULT_CASE_ARTICLES) {
    const data = toPrismaCreateData(payload);
    await prisma.contentArticle.upsert({
      where: { slug: data.slug },
      create: data,
      update: {
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        coverImageUrl: data.coverImageUrl,
        cardTag: data.cardTag,
        cardGradient: data.cardGradient,
        introJson: data.introJson,
        sectionsJson: data.sectionsJson,
        faqJson: data.faqJson,
        publishedAt: data.publishedAt,
        sortOrder: data.sortOrder,
        isActive: true,
      },
    });
    console.log("upsert", data.type, data.slug);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
