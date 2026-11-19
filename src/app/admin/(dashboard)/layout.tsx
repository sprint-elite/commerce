import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
