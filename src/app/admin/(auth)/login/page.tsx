import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-slate-500">로딩 중…</div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
