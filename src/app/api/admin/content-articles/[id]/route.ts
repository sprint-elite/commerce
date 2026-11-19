import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { parseContentArticleType } from "@/lib/content-article-types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
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

    const existing = await prisma.contentArticle.findUnique({ where: { id } });
    if (!existing) return jsonError("글을 찾을 수 없습니다.", 404);

    if (body.slug && body.slug !== existing.slug) {
      const slug = body.slug.trim().toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return jsonError("슬러그는 영문 소문자·숫자·하이픈만 가능합니다.", 400);
      }
      const clash = await prisma.contentArticle.findUnique({ where: { slug } });
      if (clash) return jsonError("이미 존재하는 슬러그입니다.", 409);
    }

    const row = await prisma.contentArticle.update({
      where: { id },
      data: {
        ...(body.type
          ? { type: parseContentArticleType(body.type) }
          : {}),
        ...(body.slug ? { slug: body.slug.trim().toLowerCase() } : {}),
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.subtitle !== undefined
          ? { subtitle: body.subtitle?.trim() || null }
          : {}),
        ...(body.coverImageUrl !== undefined
          ? { coverImageUrl: body.coverImageUrl?.trim() || null }
          : {}),
        ...(body.cardTag !== undefined
          ? { cardTag: body.cardTag?.trim() || null }
          : {}),
        ...(body.cardGradient !== undefined
          ? { cardGradient: body.cardGradient?.trim() || null }
          : {}),
        ...(body.introJson !== undefined
          ? { introJson: Array.isArray(body.introJson) ? body.introJson : [] }
          : {}),
        ...(body.sectionsJson !== undefined
          ? {
              sectionsJson: Array.isArray(body.sectionsJson)
                ? body.sectionsJson
                : [],
            }
          : {}),
        ...(body.faqJson !== undefined
          ? { faqJson: Array.isArray(body.faqJson) ? body.faqJson : [] }
          : {}),
        ...(body.publishedAt
          ? { publishedAt: new Date(body.publishedAt) }
          : {}),
        ...(body.sortOrder !== undefined
          ? { sortOrder: Math.round(Number(body.sortOrder) || 0) }
          : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });

    return NextResponse.json({ article: { id: row.id, slug: row.slug } });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.contentArticle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
