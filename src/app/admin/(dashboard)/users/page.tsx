import { getCurrentUser } from "@/lib/auth";
import { fetchAdminUsers } from "@/lib/admin-users";
import { AdminUserManager } from "@/components/admin/AdminUserManager";

export default async function AdminUsersPage() {
  const [users, me] = await Promise.all([fetchAdminUsers(), getCurrentUser()]);
  return (
    <AdminUserManager
      initialUsers={users}
      currentUserId={me?.id ?? ""}
    />
  );
}
