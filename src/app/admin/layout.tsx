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
  ChevronRight,
  Settings,
  BarChart3,
  LogOut,
  Package,
  ShieldCheck,
  Menu,
  X,
  Wrench,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/parts").then((r) => r.json()),
    ]).then(([s, parts]) => {
      if (s.businessName) setBusinessName(s.businessName);
      if (s.brandColor) {
        document.documentElement.style.setProperty("--color-primary-600", s.brandColor);
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
      // Calculate low stock alerts
      if (Array.isArray(parts)) {
        const threshold = s.lowStockThreshold || 3;
        const alerts = parts.filter((p: any) => p.stock <= threshold).length;
        setLowStockCount(alerts);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const mainNav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/nueva-orden", label: "Nueva Orden", icon: PlusCircle },
    { href: "/admin/ordenes", label: "Órdenes", icon: List },
    { href: "/admin/servicios", label: "Servicios", icon: Wrench },
    { href: "/admin/inventario", label: "Inventario", icon: Package },
  ];

  const analysisNav = [
    { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  ];

  const settingsNav = [
    { href: "/admin/configuracion", label: "Configuración", icon: Settings },
    { href: "/admin/cuenta", label: "Cuenta", icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50 shrink-0">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 shrink-0">
          <Monitor className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white truncate">
              {businessName || "Mi Taller"}
            </h1>
            <p className="text-[10px] text-slate-400 truncate">Panel Admin</p>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Principal
          </p>
        )}
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              {item.href === "/admin/inventario" && lowStockCount > 0 && (
                <span className={`${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full`}>
                  {lowStockCount}
                </span>
              )}
              {active && !sidebarCollapsed && item.href !== "/admin/inventario" && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}

        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-6">
            Análisis
          </p>
        )}
        {sidebarCollapsed && <div className="my-3 border-t border-slate-700/50" />}
        {analysisNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-6">
            Sistema
          </p>
        )}
        {sidebarCollapsed && <div className="my-3 border-t border-slate-700/50" />}
        {settingsNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-700/50 p-3 space-y-1 shrink-0">
        <Link
          href="/"
          title={sidebarCollapsed ? "Ver sitio público" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
        >
          <ChevronLeft className="h-[18px] w-[18px] shrink-0" />
          {!sidebarCollapsed && <span>Ver sitio</span>}
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={sidebarCollapsed ? "Cerrar sesión" : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!sidebarCollapsed && <span>{loggingOut ? "Saliendo..." : "Cerrar sesión"}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-slate-800 z-50 transition-all duration-300 ${
          sidebarCollapsed ? "w-[72px]" : "w-60"
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full p-1 shadow-lg transition-colors border border-slate-600"
        >
          {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile Top Bar */}
      <nav className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex justify-between items-center h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-1.5 rounded-lg">
                <Monitor className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">{businessName || "Mi Taller"}</span>
            </div>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-primary-600">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50 overlay-fade-in" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="lg:hidden fixed top-0 left-0 h-screen w-72 bg-slate-800 z-50 shadow-2xl sidebar-slide-in">
            <SidebarContent />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </>
      )}

      {/* Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-60"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex justify-around items-center py-1.5">
          {[mainNav[0], mainNav[1], mainNav[2], mainNav[3], analysisNav[0]].map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg min-w-[56px] transition-colors ${
                  active ? "text-blue-600" : "text-gray-400"
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
