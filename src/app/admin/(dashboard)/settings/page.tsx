import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">사이트 설정</h1>
      <p className="text-sm text-slate-500">
        사업자·문의 정보 (푸터·약관·FAQ)
      </p>
      <AdminSettingsForm initialSettings={settings} />
    </div>
  );
}
