import { requireAdmin } from "@/lib/auth";
import { AdminInquiryManager } from "@/components/admin/AdminInquiryManager";

export default async function AdminInquiriesPage() {
  await requireAdmin();
  return <AdminInquiryManager />;
}
