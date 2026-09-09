"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Users,
  Settings,
  BarChart3,
  Bike,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package, adminOnly: true },
  { href: "/sales", label: "Sales History", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3, adminOnly: true },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function Sidebar({ role }: { role: "ADMIN" | "CASHIER" }) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "ADMIN");

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-ink-950 text-ink-100 min-h-screen">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
          <Bike className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-sm text-white">JP Laagan</p>
          <p className="text-[11px] text-ink-400">MotoPOS</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-500 text-white"
                  : "text-ink-300 hover:bg-ink-900 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-[11px] text-ink-500">v1.0 · Motorcycle Parts</div>
    </aside>
  );
}
