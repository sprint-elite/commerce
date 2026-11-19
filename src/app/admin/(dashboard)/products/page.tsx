import { AdminProductManager } from "@/components/admin/AdminProductManager";
import {
  fetchAdminCategories,
  fetchAdminProducts,
} from "@/lib/admin-catalog";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    fetchAdminProducts(),
    fetchAdminCategories(),
  ]);
  return (
    <AdminProductManager
      initialProducts={products}
      categories={categories}
    />
  );
}
