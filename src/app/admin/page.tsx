"use client";

import { useEffect, useState, useMemo } from "react";
import { ServiceOrder, STATUS_CONFIG, OrderStatus } from "@/types/order";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Inbox,
  Search,
  Wrench,
  CheckCircle,
  Package,
  PlusCircle,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatMoneyShort } from "@/lib/currencies";

const RechartsLine = dynamic(() => import("recharts").then(m => {
  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } = m;
  const Chart = ({ data, currency }: { data: { name: string; ordenes: number; ingresos: number }[]; currency: string }) => (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorOrdenes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
          formatter={(value: unknown, name: unknown) => { const v = Number(value); const n = String(name); return [n === "ingresos" ? formatMoneyShort(v, currency) : v, n === "ingresos" ? "Ingresos" : "Órdenes"]; }}
        />
        <Area type="monotone" dataKey="ordenes" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrdenes)" dot={{ r: 3, fill: "#3b82f6" }} />
        <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIngresos)" dot={{ r: 3, fill: "#10b981" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
  return Chart;
}), { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center"><div className="h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div> });

const RechartsPie = dynamic(() => import("recharts").then(m => {
  const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = m;
  const COLORS = ["#f59e0b", "#6366f1", "#3b82f6", "#10b981", "#64748b"];
  const Chart = ({ data }: { data: { name: string; value: number }[] }) => (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }} />
      </PieChart>
    </ResponsiveContainer>
  );
  return Chart;
}), { ssr: false, loading: () => <div className="h-[220px] flex items-center justify-center"><div className="h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div> });

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  recibido: Inbox,
  diagnosticando: Search,
  reparando: Wrench,
  listo: CheckCircle,
  entregado: Package,
};

const DONUT_COLORS: Record<OrderStatus, string> = {
  recibido: "bg-amber-400",
  diagnosticando: "bg-indigo-500",
  reparando: "bg-blue-500",
  listo: "bg-emerald-500",
  entregado: "bg-slate-400",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("MXN");

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()).catch(() => ({})),
    ]).then(([data, settings]) => {
      setOrders(Array.isArray(data) ? data : []);
      if (settings?.currency) setCurrency(settings.currency);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [orders]);

  const activeOrders = useMemo(() => orders.filter(o => o.status !== "entregado"), [orders]);
  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + (o.estimatedCost || 0), 0), [orders]);
  const deliveredRevenue = useMemo(() => orders.filter(o => o.status === "entregado").reduce((s, o) => s + (o.estimatedCost || 0), 0), [orders]);

  const monthlyData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { month: d.getMonth(), year: d.getFullYear(), name: months[d.getMonth()] };
    });
    return last6.map(m => {
      const mOrders = orders.filter(o => { const d = new Date(o.createdAt); return d.getMonth() === m.month && d.getFullYear() === m.year; });
      return { name: m.name, ordenes: mOrders.length, ingresos: mOrders.reduce((s, o) => s + (o.estimatedCost || 0), 0) };
    });
  }, [orders]);

  const donutData = useMemo(() =>
    (Object.keys(STATUS_CONFIG) as OrderStatus[])
      .map(s => ({ name: STATUS_CONFIG[s].label, value: statusCounts[s] || 0 }))
      .filter(d => d.value > 0),
  [statusCounts]);

  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6),
  [orders]);

  const recentActivity = useMemo(() => {
    const items: { id: string; icon: React.ElementType; color: string; bg: string; text: string; sub: string; time: string }[] = [];
    const sorted = [...orders].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
    sorted.forEach(o => {
      const config = STATUS_CONFIG[o.status];
      const Icon = STATUS_ICONS[o.status];
      const ago = getTimeAgo(new Date(o.updatedAt));
      items.push({
        id: o.id,
        icon: Icon,
        color: config.color,
        bg: config.bgColor,
        text: `${o.orderNumber} — ${config.label}`,
        sub: `${o.customerName} · ${o.deviceBrand} ${o.deviceType}`,
        time: ago,
      });
    });
    return items;
  }, [orders]);

  // This month vs last month comparison
  const thisMonthOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => { const d = new Date(o.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  }, [orders]);
  const lastMonthOrders = useMemo(() => {
    const now = new Date();
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return orders.filter(o => { const d = new Date(o.createdAt); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); });
  }, [orders]);

  const ordersTrend = lastMonthOrders.length > 0 ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100) : 0;
  const thisMonthRevenue = thisMonthOrders.reduce((s, o) => s + (o.estimatedCost || 0), 0);
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + (o.estimatedCost || 0), 0);
  const revenueTrend = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Resumen general del taller</p>
        </div>
        <Link href="/admin/nueva-orden" className="btn-primary flex items-center gap-2 w-fit">
          <PlusCircle className="h-4 w-4" />
          Nueva Orden
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3.5 sm:p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-emerald-100 text-xs sm:text-sm font-medium">Ingresos Totales</p>
              <p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatMoneyShort(totalRevenue, currency)}</p>
              {revenueTrend !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${revenueTrend > 0 ? "text-emerald-100" : "text-red-200"}`}>
                  {revenueTrend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {Math.abs(revenueTrend).toFixed(1)}% vs mes anterior
                </div>
              )}
            </div>
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl hidden sm:block">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
        </div>

        {/* Orders Count */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3.5 sm:p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Órdenes</p>
              <p className="text-lg sm:text-2xl font-bold mt-1">{orders.length}</p>
              {ordersTrend !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${ordersTrend > 0 ? "text-blue-100" : "text-red-200"}`}>
                  {ordersTrend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {Math.abs(ordersTrend).toFixed(1)}% vs mes anterior
                </div>
              )}
            </div>
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl hidden sm:block">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
        </div>

        {/* Active Orders */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-3.5 sm:p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-amber-100 text-xs sm:text-sm font-medium">Órdenes Activas</p>
              <p className="text-lg sm:text-2xl font-bold mt-1">{activeOrders.length}</p>
              <p className="text-[10px] sm:text-xs text-amber-100 mt-2">En proceso ahora</p>
            </div>
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl hidden sm:block">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
        </div>

        {/* Delivered Revenue */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-3.5 sm:p-5 text-white shadow-lg shadow-violet-500/20">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-violet-100 text-xs sm:text-sm font-medium">Cobrado</p>
              <p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatMoneyShort(deliveredRevenue, currency)}</p>
              <p className="text-[10px] sm:text-xs text-violet-100 mt-2">Equipos entregados</p>
            </div>
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl hidden sm:block">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Resumen Mensual</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Órdenes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Ingresos</span>
            </div>
          </div>
          <RechartsLine data={monthlyData} currency={currency} />
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Estado de Órdenes</h3>
          {donutData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          ) : (
            <RechartsPie data={donutData} />
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(s => (
              <span key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`w-2 h-2 rounded-full ${DONUT_COLORS[s]}`} />
                {STATUS_CONFIG[s].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Inbox className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin actividad</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`${item.bg} p-2 rounded-xl shrink-0`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.text}</p>
                      <p className="text-xs text-gray-500 truncate">{item.sub}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">{item.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Órdenes Recientes</h3>
            <Link href="/admin/ordenes" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Inbox className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay órdenes</p>
              <Link href="/admin/nueva-orden" className="text-blue-600 text-xs font-medium mt-1 inline-block">Crear primera orden</Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Orden</th>
                    <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                    <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Costo</th>
                    <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <Link href={`/admin/ordenes/${order.id}`} className="text-blue-600 font-medium hover:underline text-xs">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="text-gray-800 font-medium text-xs">{order.customerName}</p>
                          <p className="text-gray-400 text-[11px]">{order.deviceBrand} {order.deviceType}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <span className="text-xs font-semibold text-gray-700">{order.estimatedCost > 0 ? formatMoneyShort(order.estimatedCost, currency) : "—"}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CONFIG[order.status].bgColor} ${STATUS_CONFIG[order.status].color}`}>
                          {STATUS_CONFIG[order.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
