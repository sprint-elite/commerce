import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { formatEmailOrPhoneInquiry } from "@/lib/site-contact";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteSettings();
  return {
    title: "교환·반품 안내",
    description: `${info.brandName} 청약철회·교환·반품 안내`,
  };
}

export default async function ReturnsPage() {
  const info = await getSiteSettings();
  const contact = formatEmailOrPhoneInquiry(info.email, info.phone);

  return (
    <LegalPageShell title="교환·반품 안내">
      <p>
        「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 청약철회 및
        교환·반품 기준을 안내합니다.
      </p>

      <LegalSection title="1. 청약철회가 가능한 경우">
        <p>
          상품을 배송받은 날부터 7일 이내, 그리고 표시·광고와 다르거나 계약
          내용과 다르게 이행된 경우에는 관련 법령에 따라 청약철회가 가능할 수
          있습니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 청약철회가 제한되는 경우">
        <p>
          고객의 요청에 따라 개별적으로 제작되는 커스텀(주문제작) 상품은 제작이
          착수된 이후 교환·반품이 어려울 수 있습니다. 또한 고객 책임으로 상품이
          멸실·훼손된 경우, 시간이 지나 재판매가 곤란한 경우 등에는 제한될 수
          있습니다.
        </p>
      </LegalSection>

      <LegalSection title="3. 불량·오배송">
        <p>
          제작 불량 또는 회사 귀책의 오배송이 확인되면 동일 상품 재제작 또는
          환불을 도와드립니다. 수령 후 가능한 빨리 사진과 함께 문의해 주세요.
        </p>
      </LegalSection>

      <LegalSection title="4. 온라인 신청">
        <p>
          로그인 후{" "}
          <Link
            href="/mypage/returns"
            className="font-medium text-zinc-900 underline"
          >
            마이페이지 → 교환·반품 신청
          </Link>
          에서 주문번호와 사유를 남겨 주세요. 결제 완료 후 제작·배송이 진행된
          주문만 신청할 수 있습니다.
        </p>
        <p className="mt-3">
          {contact ? (
            <>
              급한 문의는 {contact}으로 주문번호와 함께 연락해 주세요.
            </>
          ) : null}
          {info.hours ? ` 운영시간: ${info.hours}` : null}
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
