import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { formatEmailOrPhoneInquiry } from "@/lib/site-contact";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteSettings();
  return {
    title: "자주 묻는 질문",
    description: `${info.brandName} FAQ`,
  };
}

const FAQS = [
  {
    q: "주문 후 제작은 언제 시작되나요?",
    a: "주문이 접수되면 확인 후 제작이 진행됩니다. 커스텀 상품은 디자인 확정 후 제작에 들어갑니다.",
  },
  {
    q: "제작은 얼마나 걸리나요?",
    a: "평균 제작은 영업일 기준 3~5일 정도 소요될 수 있으며, 수량·옵션에 따라 달라질 수 있습니다.",
  },
  {
    q: "커스텀 상품도 교환·반품이 가능한가요?",
    a: "고객 요청으로 제작되는 주문제작 상품은 제작 착수 이후 교환·반품이 제한될 수 있습니다. 자세한 내용은 교환·반품 안내를 확인해 주세요.",
  },
  {
    q: "주문 상태는 어디서 확인하나요?",
    a: "마이페이지 > 주문 상세에서 접수부터 작업 완료까지의 상태를 확인할 수 있습니다.",
  },
  {
    q: "회원 정보는 어디서 바꾸나요?",
    a: "마이페이지의 ‘내 정보’에서 수정할 수 있습니다.",
  },
] as const;

export default async function FaqPage() {
  const info = await getSiteSettings();

  return (
    <LegalPageShell title="자주 묻는 질문">
      <p>
        주문·제작과 관련해 자주 묻는 내용을 모았습니다. 해결되지 않으면{" "}
        <a href={`mailto:${info.email}`} className="underline">
          {info.email}
        </a>
        로 문의해 주세요.
      </p>

      {FAQS.map((item) => (
        <LegalSection key={item.q} title={item.q}>
          <p>{item.a}</p>
        </LegalSection>
      ))}

      <p className="pt-2">
        관련 안내:{" "}
        <Link href="/returns" className="underline hover:text-zinc-900">
          교환·반품
        </Link>
        {" · "}
        <Link href="/terms" className="underline hover:text-zinc-900">
          이용약관
        </Link>
        {" · "}
        <Link href="/privacy" className="underline hover:text-zinc-900">
          개인정보처리방침
        </Link>
      </p>
    </LegalPageShell>
  );
}
