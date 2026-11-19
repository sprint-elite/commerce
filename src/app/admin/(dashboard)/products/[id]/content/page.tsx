import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

/** 구 URL 호환 → 통합 편집 페이지의 상세 탭으로 */
export default async function AdminProductContentRedirect({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  redirect(`/admin/products/${id}?tab=content`);
}
