export const CONTENT_ARTICLE_TYPES = ["GUIDE", "IDEA", "CASE"] as const;

export type ContentArticleType = (typeof CONTENT_ARTICLE_TYPES)[number];

export function parseContentArticleType(
  value: string | null | undefined,
): ContentArticleType {
  if (value === "IDEA" || value === "CASE") return value;
  return "GUIDE";
}

export function articlePath(type: ContentArticleType, slug: string) {
  if (type === "IDEA") return `/ideas/${slug}`;
  if (type === "CASE") return "/#cases";
  return `/guides/${slug}`;
}

export function contentArticleTypeLabel(type: string) {
  if (type === "IDEA") return "상황별 굿즈";
  if (type === "CASE") return "제작 사례";
  return "제작 가이드";
}
