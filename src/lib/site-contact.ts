/** 서버·클라이언트 공용 연락처 표기 */
export function formatEmailPhoneContact(email: string, phone: string): string {
  const parts = [email.trim(), phone.trim()].filter(Boolean);
  return parts.join(" / ");
}

/** 「이메일 또는 전화」 문장용 */
export function formatEmailOrPhoneInquiry(email: string, phone: string): string {
  const e = email.trim();
  const p = phone.trim();
  if (e && p) return `${e} 또는 ${p}`;
  return e || p;
}
