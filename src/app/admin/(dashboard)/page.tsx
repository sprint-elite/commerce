import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { fetchAdminDashboardData } from "@/lib/admin-dashboard";

export default async function AdminPage() {
  const data = await fetchAdminDashboardData();
  return <AdminDashboard data={data} />;
}
