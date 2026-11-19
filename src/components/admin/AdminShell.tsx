"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  FileText,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  LogOut,
  MessageSquare,
  Package,
  PackageOpen,
  Settings,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const STORAGE_KEY = "jh-admin-nav-collapsed";

const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "개요",
    items: [
      { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    id: "orders",
    label: "주문",
    items: [
      { href: "/admin/orders", label: "주문 목록", icon: ClipboardList, exact: false },
      {
        href: "/admin/returns",
        label: "교환 · 반품",
        icon: PackageOpen,
        exact: false,
      },
    ],
  },
  {
    id: "products",
    label: "상품",
    items: [
      { href: "/admin/categories", label: "카테고리", icon: FolderTree, exact: false },
      { href: "/admin/products", label: "상품", icon: ShoppingBag, exact: false },
      { href: "/admin/collections", label: "컬렉션", icon: Layers, exact: false },
    ],
  },
  {
    id: "marketing",
    label: "마케팅",
    items: [
      { href: "/admin/banners", label: "배너", icon: ImageIcon, exact: false },
      { href: "/admin/content", label: "소개글", icon: FileText, exact: false },
    ],
  },
  {
    id: "customers",
    label: "고객",
    items: [
      { href: "/admin/inquiries", label: "문의", icon: MessageSquare, exact: false },
      { href: "/admin/users", label: "계정", icon: Users, exact: false },
    ],
  },
  {
    id: "system",
    label: "시스템",
    items: [
      { href: "/admin/settings", label: "설정", icon: Settings, exact: false },
    ],
  },
];

const flatNav = navGroups.flatMap((g) => g.items);

function isItemActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function groupHasActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isItemActive(pathname, item.href, item.exact));
}

function readCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

interface AdminShellProps {
  user: User;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    setCollapsed(readCollapsed());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setCollapsed((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const group of navGroups) {
        if (groupHasActive(pathname, group) && next[group.id]) {
          next[group.id] = false;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [pathname, ready]);

  const toggleGroup = (id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6f9]">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="border-b border-slate-100 px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">
                JH Admin
              </p>
              <p className="text-[11px] text-slate-400">카탈로그 · 주문 관리</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navGroups.map((group) => {
              const isOpen = !collapsed[group.id];
              const activeInGroup = groupHasActive(pathname, group);
              return (
                <div key={group.id}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50 ${
                      activeInGroup && !isOpen
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-0.5 pb-2">
                        {group.items.map((item) => {
                          const active = isItemActive(
                            pathname,
                            item.href,
                            item.exact,
                          );
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                                active
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <Icon className="h-4 w-4 shrink-0 opacity-80" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOut ? "로그아웃 중…" : "로그아웃"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6 lg:hidden">
          <Link href="/admin" className="shrink-0 text-sm font-bold text-slate-900">
            JH Admin
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
            {flatNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                  isItemActive(pathname, item.href, item.exact)
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
