import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  articlePath,
  parseContentArticleType,
} from "@/lib/content-article-types";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.contentArticle.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json({
      articles: rows.map((r) => ({
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
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      type?: string;
      slug?: string;
      title?: string;
      subtitle?: string | null;
      coverImageUrl?: string | null;
      cardTag?: string | null;
      cardGradient?: string | null;
      introJson?: unknown;
      sectionsJson?: unknown;
      faqJson?: unknown;
      publishedAt?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    const type = parseContentArticleType(body.type);
    const slug = body.slug?.trim().toLowerCase() ?? "";
    const title = body.title?.trim() ?? "";
    if (!slug || !title) {
      return jsonError("슬러그와 제목은 필수입니다.", 400);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return jsonError("슬러그는 영문 소문자·숫자·하이픈만 가능합니다.", 400);
    }

    const exists = await prisma.contentArticle.findUnique({ where: { slug } });
    if (exists) return jsonError("이미 존재하는 슬러그입니다.", 409);

    const row = await prisma.contentArticle.create({
      data: {
        type,
        slug,
        title,
        subtitle: body.subtitle?.trim() || null,
        coverImageUrl: body.coverImageUrl?.trim() || null,
        cardTag: body.cardTag?.trim() || null,
        cardGradient: body.cardGradient?.trim() || null,
        introJson: Array.isArray(body.introJson) ? body.introJson : [],
        sectionsJson: Array.isArray(body.sectionsJson) ? body.sectionsJson : [],
        faqJson: Array.isArray(body.faqJson) ? body.faqJson : [],
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
        sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ article: { id: row.id, slug: row.slug } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
