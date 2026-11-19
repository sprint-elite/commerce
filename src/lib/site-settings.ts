import { prisma } from "@/lib/db";
import { SITE_INFO } from "@/lib/site-info";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";

export type SiteSettingsData = {
  brandName: string;
  companyName: string;
  ceoName: string;
  businessNumber: string;
  mailOrderNumber: string;
  address: string;
  email: string;
  phone: string;
  hours: string;
  bankAccount: string;
  bankHolder: string;
  shippingFee: number;
  freeShippingThreshold: number;
};

/** DB JSON에만 저장 — 구버전 더미 데이터 자동 교체용 */
const SETTINGS_SCHEMA_VERSION = 2;

type StoredSiteSettings = SiteSettingsData & { schemaVersion?: number };

const DEFAULTS: SiteSettingsData = {
  ...SITE_INFO,
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
};

/** 시드/초기 더미 사업자 정보 (site-info 교체 전 DB에 남아 있던 값) */
function isLegacyPlaceholder(data: Partial<SiteSettingsData>): boolean {
  const company = data.companyName?.trim() ?? "";
  if (company.includes("제이에이치")) return true;
  if (data.businessNumber?.trim() === "000-00-00000") return true;
  if (data.ceoName?.trim() === "홍길동") return true;
  if (data.email?.trim() === "help@jhmaker.com") return true;
  if (data.address?.includes("테헤란로 000")) return true;
  return false;
}

function coerceNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function sanitizeSettings(input: Partial<SiteSettingsData>): SiteSettingsData {
  return {
    brandName: String(input.brandName ?? DEFAULTS.brandName).trim() || DEFAULTS.brandName,
    companyName:
      String(input.companyName ?? DEFAULTS.companyName).trim() || DEFAULTS.companyName,
    ceoName: String(input.ceoName ?? DEFAULTS.ceoName).trim() || DEFAULTS.ceoName,
    businessNumber:
      String(input.businessNumber ?? DEFAULTS.businessNumber).trim() ||
      DEFAULTS.businessNumber,
    mailOrderNumber: String(input.mailOrderNumber ?? "").trim(),
    address: String(input.address ?? DEFAULTS.address).trim() || DEFAULTS.address,
    email: String(input.email ?? DEFAULTS.email).trim() || DEFAULTS.email,
    phone: String(input.phone ?? "").trim(),
    hours: String(input.hours ?? DEFAULTS.hours).trim() || DEFAULTS.hours,
    bankAccount:
      String(input.bankAccount ?? DEFAULTS.bankAccount).trim() || DEFAULTS.bankAccount,
    bankHolder:
      String(input.bankHolder ?? DEFAULTS.bankHolder).trim() || DEFAULTS.bankHolder,
    shippingFee: coerceNumber(input.shippingFee, DEFAULTS.shippingFee),
    freeShippingThreshold: coerceNumber(
      input.freeShippingThreshold,
      DEFAULTS.freeShippingThreshold,
    ),
  };
}

function resolveStoredSettings(raw: Partial<StoredSiteSettings>): {
  settings: SiteSettingsData;
  persist: StoredSiteSettings | null;
} {
  const shippingFee = coerceNumber(raw.shippingFee, DEFAULTS.shippingFee);
  const freeShippingThreshold = coerceNumber(
    raw.freeShippingThreshold,
    DEFAULTS.freeShippingThreshold,
  );

  if (isLegacyPlaceholder(raw)) {
    const settings = sanitizeSettings({
      ...DEFAULTS,
      shippingFee,
      freeShippingThreshold,
    });
    return {
      settings,
      persist: { ...settings, schemaVersion: SETTINGS_SCHEMA_VERSION },
    };
  }

  const settings = sanitizeSettings({
    ...DEFAULTS,
    ...raw,
    shippingFee,
    freeShippingThreshold,
  });

  const needsVersionBump =
    (raw.schemaVersion ?? 0) < SETTINGS_SCHEMA_VERSION;
  return {
    settings,
    persist: needsVersionBump
      ? { ...settings, schemaVersion: SETTINGS_SCHEMA_VERSION }
      : null,
  };
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const row = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  if (!row || !row.data || typeof row.data !== "object") {
    return { ...DEFAULTS };
  }

  const { settings, persist } = resolveStoredSettings(
    row.data as Partial<StoredSiteSettings>,
  );

  if (persist) {
    const prev = JSON.stringify(row.data);
    const next = JSON.stringify(persist);
    if (prev !== next) {
      await prisma.siteSetting.upsert({
        where: { id: "default" },
        create: { id: "default", data: persist },
        update: { data: persist },
      });
    }
  }

  return settings;
}

export async function saveSiteSettings(
  patch: Partial<SiteSettingsData>,
): Promise<SiteSettingsData> {
  const current = await getSiteSettings();
  const merged = sanitizeSettings({ ...current, ...patch });
  const stored: StoredSiteSettings = {
    ...merged,
    schemaVersion: SETTINGS_SCHEMA_VERSION,
  };

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: { id: "default", data: stored },
    update: { data: stored },
  });

  return merged;
}

export { SITE_INFO };
