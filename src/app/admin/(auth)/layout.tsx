import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4 py-12">
      {children}
    </div>
  );
}
