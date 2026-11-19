import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { formatEmailPhoneContact } from "@/lib/site-contact";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteSettings();
  return {
    title: "개인정보처리방침",
    description: `${info.brandName} 개인정보처리방침`,
  };
}

export default async function PrivacyPage() {
  const info = await getSiteSettings();

  return (
    <LegalPageShell title="개인정보처리방침">
      <p>
        {info.companyName}(이하 &ldquo;회사&rdquo;)는 개인정보 보호법 등
        관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을
        신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을
        수립·공개합니다.
      </p>

      <LegalSection title="1. 수집하는 개인정보 항목">
        <p>
          회원가입 및 주문 과정에서 이름, 이메일, 비밀번호, 연락처, 배송지
          정보(수령인, 주소, 연락처), 주문·결제 관련 정보를 수집할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 개인정보의 수집·이용 목적">
        <p>
          회원 식별 및 본인 확인, 주문·제작·배송 처리, 고객 문의 대응, 서비스
          개선 및 부정 이용 방지 목적으로 개인정보를 이용합니다.
        </p>
      </LegalSection>

      <LegalSection title="3. 보유 및 이용 기간">
        <p>
          원칙적으로 목적 달성 후 지체 없이 파기합니다. 다만 관련 법령에 따라
          일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.
          (예: 전자상거래 등에서의 소비자보호에 관한 법률에 따른 계약·대금결제
          기록 등)
        </p>
      </LegalSection>

      <LegalSection title="4. 개인정보의 제3자 제공">
        <p>
          회사는 원칙적으로 이용자 동의 없이 개인정보를 외부에 제공하지
          않습니다. 다만 배송을 위해 필요한 범위에서 택배사 등에 제공하거나,
          법령에 근거한 경우에는 예외로 합니다.
        </p>
      </LegalSection>

      <LegalSection title="5. 개인정보의 파기">
        <p>
          전자적 파일 형태의 정보는 복구 불가능한 방법으로 삭제하며, 종이 문서는
          분쇄 또는 소각하여 파기합니다.
        </p>
      </LegalSection>

      <LegalSection title="6. 이용자의 권리">
        <p>
          이용자는 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.
          마이페이지에서 회원정보·배송지를 수정하거나, 아래로 요청할 수
          있습니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 개인정보 보호책임자">
        <p>
          문의: {formatEmailPhoneContact(info.email, info.phone) || info.email}
          <br />
          상호: {info.companyName}
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
