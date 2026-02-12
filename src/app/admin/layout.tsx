"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Monitor,
  LayoutDashboard,
  PlusCircle,
  List,
  ChevronLeft,
  Settings,
  BarChart3,
  LogOut,
  Package,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.brandColor) {
          document.documentElement.style.setProperty("--color-primary-600", s.brandColor);
          // Generate lighter/darker shades from brandColor
          const hex = s.brandColor.replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          document.documentElement.style.setProperty("--color-primary-50", `rgba(${r},${g},${b},0.05)`);
          document.documentElement.style.setProperty("--color-primary-100", `rgba(${r},${g},${b},0.1)`);
          document.documentElement.style.setProperty("--color-primary-200", `rgba(${r},${g},${b},0.2)`);
          document.documentElement.style.setProperty("--color-primary-300", `rgba(${r},${g},${b},0.35)`);
          document.documentElement.style.setProperty("--color-primary-400", `rgba(${r},${g},${b},0.55)`);
          document.documentElement.style.setProperty("--color-primary-500", `rgba(${r},${g},${b},0.8)`);
          document.documentElement.style.setProperty("--color-primary-700", `rgb(${Math.max(0,r-25)},${Math.max(0,g-25)},${Math.max(0,b-25)})`);
          document.documentElement.style.setProperty("--color-primary-800", `rgb(${Math.max(0,r-45)},${Math.max(0,g-45)},${Math.max(0,b-45)})`);
          document.documentElement.style.setProperty("--color-primary-900", `rgb(${Math.max(0,r-65)},${Math.max(0,g-65)},${Math.max(0,b-65)})`);
        }
      })
      .catch(() => {});
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/nueva-orden", label: "Nueva Orden", icon: PlusCircle },
    { href: "/admin/ordenes", label: "Todas las Órdenes", icon: List },
    { href: "/admin/inventario", label: "Inventario", icon: Package },
    { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/admin/configuracion", label: "Configuración", icon: Settings },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Panel de Administración
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver al sitio</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-sm text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 p-2 rounded-lg hover:bg-red-50"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sub Nav - Desktop */}
      <div className="hidden sm:block bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Bottom Nav - Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex justify-around items-center py-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg min-w-[56px] transition-colors ${
                  isActive
                    ? "text-primary-700"
                    : "text-gray-400"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
