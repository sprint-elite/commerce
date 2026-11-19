"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { SiteSettingsData } from "@/lib/site-settings";

const FIELD_LABELS: Partial<Record<keyof SiteSettingsData, string>> = {
  brandName: "브랜드명 (푸터·저작권)",
  companyName: "상호 (업체명)",
  ceoName: "대표자명",
  businessNumber: "사업자등록번호",
  address: "사업장 주소",
  email: "문의 이메일",
  hours: "영업시간",
  shippingFee: "기본 배송비 (원)",
  freeShippingThreshold: "무료배송 기준 금액 (원)",
};

const FORM_FIELDS: Array<keyof SiteSettingsData> = [
  "brandName",
  "companyName",
  "ceoName",
  "businessNumber",
  "address",
  "email",
  "hours",
  "shippingFee",
  "freeShippingThreshold",
];

interface AdminSettingsFormProps {
  initialSettings: SiteSettingsData;
}

export function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await res.json()) as {
        settings?: SiteSettingsData;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      if (!data.settings) throw new Error("저장 응답이 올바르지 않습니다.");
      setSettings(data.settings);
      setMsg("저장되었습니다. 쇼핑몰 푸터·약관에 바로 반영됩니다.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        통신판매업·고객센터 전화는 쇼핑몰에 표시하지 않습니다. 아래 값이 푸터와
        FAQ·약관에 사용됩니다.
      </p>
      {FORM_FIELDS.map((key) => (
        <label key={key} className="block text-sm">
          <span className="text-xs font-medium text-slate-500">
            {FIELD_LABELS[key] ?? key}
          </span>
          <input
            type={key === "shippingFee" || key === "freeShippingThreshold" ? "number" : "text"}
            value={String(settings[key] ?? "")}
            onChange={(e) => {
              const raw = e.target.value;
              setSettings((s) => ({
                ...s,
                [key]:
                  key === "shippingFee" || key === "freeShippingThreshold"
                    ? Number(raw)
                    : raw,
              }));
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
      ))}
      {msg && (
        <p
          className={`text-sm ${msg.includes("실패") || msg.includes("올바르") ? "text-red-600" : "text-emerald-700"}`}
        >
          {msg}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        저장
      </button>
    </div>
  );
}
