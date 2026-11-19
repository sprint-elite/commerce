import { requireAdmin } from "@/lib/auth";
import { AdminReturnManager } from "@/components/admin/AdminReturnManager";

export default async function AdminReturnsPage() {
  await requireAdmin();
  return <AdminReturnManager />;
}
