import { AdminCategoryManager } from "@/components/admin/AdminCategoryManager";
import { fetchAdminCategories } from "@/lib/admin-catalog";

export default async function AdminCategoriesPage() {
  const categories = await fetchAdminCategories();
  return <AdminCategoryManager initialCategories={categories} />;
}
