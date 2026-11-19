"use client";

import { createContext, useContext } from "react";
import { SITE_INFO } from "@/lib/site-info";
import type { SiteSettingsData } from "@/lib/site-settings";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";

const SiteInfoContext = createContext<SiteSettingsData | null>(null);

export function SiteInfoProvider({
  value,
  children,
}: {
  value: SiteSettingsData;
  children: React.ReactNode;
}) {
  return (
    <SiteInfoContext.Provider value={value}>{children}</SiteInfoContext.Provider>
  );
}

/** 관리자 설정(DB) — 레이아웃에서 주입, 없으면 site-info 기본값 */
export function useSiteInfo(): SiteSettingsData {
  const ctx = useContext(SiteInfoContext);
  if (ctx) return ctx;
  return {
    ...SITE_INFO,
    shippingFee: SHIPPING_FEE,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  };
}
