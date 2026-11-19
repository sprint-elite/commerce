import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { formatEmailPhoneContact } from "@/lib/site-contact";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE_INFO } from "@/lib/site-info";

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteSettings();
  return {
    title: "이용약관",
    description: `${info.brandName} 서비스 이용약관`,
  };
}

export default async function TermsPage() {
  const info = await getSiteSettings();

  return (
    <LegalPageShell title="이용약관">
      <p>
        본 약관은 {info.companyName}(이하 &ldquo;회사&rdquo;)가 운영하는{" "}
        {info.brandName} 서비스의 이용 조건과 절차, 회사와 이용자의 권리·의무
        및 책임사항을 규정합니다.
      </p>

      <LegalSection title="제1조 (목적)">
        <p>
          이 약관은 회사가 제공하는 커스텀 굿즈 주문·제작 관련 서비스의 이용과
          관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 정함을 목적으로
          합니다.
        </p>
      </LegalSection>

      <LegalSection title="제2조 (정의)">
        <p>
          &ldquo;회원&rdquo;이란 본 약관에 동의하고 회원가입을 완료한 자를
          말합니다. &ldquo;서비스&rdquo;란 회사가 제공하는 상품 안내, 디자인
          편집, 주문·결제·제작·배송 관련 일체의 서비스를 말합니다.
        </p>
      </LegalSection>

      <LegalSection title="제3조 (약관의 효력 및 변경)">
        <p>
          회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며,
          개정 시 서비스 화면에 공지합니다. 변경된 약관에 동의하지 않는 경우
          회원은 이용을 중단하고 탈퇴할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="제4조 (서비스의 제공)">
        <p>
          회사는 상품 정보 제공, 커스텀 디자인 도구, 주문 접수, 제작 진행 안내,
          배송 관련 정보 제공 등의 서비스를 제공합니다. 서비스 내용은 운영
          정책에 따라 변경될 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="제5조 (회원가입 및 계정)">
        <p>
          회원은 정확한 정보를 제공해야 하며, 계정과 비밀번호 관리 책임은
          회원에게 있습니다. 타인의 정보를 도용하거나 허위 정보를 등록한 경우
          서비스 이용이 제한될 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="제6조 (주문 및 결제)">
        <p>
          주문은 회원이 상품·옵션·배송정보를 확인하고 주문을 완료함으로써
          성립합니다. 결제 방식은 회사가 안내하는 방법에 따르며, 입금 확인 후
          제작이 진행될 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="제7조 (청약철회 등)">
        <p>
          커스텀 제작 상품은 주문 확정·제작 착수 이후 교환·환불이 제한될 수
          있습니다. 자세한 내용은{" "}
          <a href="/returns" className="underline hover:text-zinc-900">
            교환·반품 안내
          </a>
          를 따릅니다.
        </p>
      </LegalSection>

      <LegalSection title="제8조 (책임의 제한)">
        <p>
          회사는 천재지변, 불가항력, 회원 귀책사유로 인한 서비스 이용 장애에
          대해 책임을 지지 않습니다. 또한 회원이 제공한 디자인·콘텐츠의
          저작권·초상권 침해에 대한 책임은 회원에게 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="제9조 (문의)">
        <p>
          약관 관련 문의:{" "}
          {formatEmailPhoneContact(info.email, info.phone) || SITE_INFO.email}
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
