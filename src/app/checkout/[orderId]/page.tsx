import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ orderId: string }> };

/** 결제 단계 제거 — 기존 체크아웃 주소는 주문 상세로 보냄 */
export default async function CheckoutPage({ params }: PageProps) {
  const { orderId } = await params;
  redirect(`/mypage/orders/${orderId}`);
}
