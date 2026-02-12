"use client";

import { useEffect, useState } from "react";
import { ServiceOrder, STATUS_CONFIG, OrderStatus } from "@/types/order";
import { BarChart3, TrendingUp, Clock, DollarSign, Calendar } from "lucide-react";

export default function ReportesPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const periodStart = new Date();
  if (period === "week") periodStart.setDate(now.getDate() - 7);
  else if (period === "month") periodStart.setMonth(now.getMonth() - 1);
  else periodStart.setFullYear(now.getFullYear() - 1);

  const periodOrders = orders.filter(
    (o) => new Date(o.createdAt) >= periodStart
  );

  const totalRevenue = periodOrders.reduce(
    (sum, o) => sum + (o.estimatedCost || 0),
    0
  );

  const deliveredInPeriod = periodOrders.filter(
    (o) => o.status === "entregado"
  );

  const deliveredRevenue = deliveredInPeriod.reduce(
    (sum, o) => sum + (o.estimatedCost || 0),
    0
  );

  const totalPartsCost = periodOrders.reduce(
    (sum, o) => sum + (o.partsCost || 0),
    0
  );

  const totalLaborCost = periodOrders.reduce(
    (sum, o) => sum + (o.laborCost || 0),
    0
  );

  const totalProfit = totalRevenue - totalPartsCost - totalLaborCost;

  const deliveredProfit = deliveredInPeriod.reduce(
    (sum, o) => sum + ((o.estimatedCost || 0) - (o.partsCost || 0) - (o.laborCost || 0)),
    0
  );

  const avgRepairTime = (() => {
    const delivered = orders.filter(
      (o) => o.status === "entregado" && o.statusHistory && o.statusHistory.length > 0
    );
    if (delivered.length === 0) return 0;
    const totalDays = delivered.reduce((sum, o) => {
      const created = new Date(o.createdAt).getTime();
      const lastChange = o.statusHistory[o.statusHistory.length - 1];
      const finished = lastChange ? new Date(lastChange.date).getTime() : created;
      return sum + (finished - created) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / delivered.length * 10) / 10;
  })();

  const statusCounts = periodOrders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const deviceTypeCounts = periodOrders.reduce(
    (acc, o) => {
      const key = o.deviceType || "Sin tipo";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const brandCounts = periodOrders.reduce(
    (acc, o) => {
      const key = o.deviceBrand || "Sin marca";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxStatusCount = Math.max(...Object.values(statusCounts), 1);
  const maxDeviceCount = Math.max(...Object.values(deviceTypeCounts), 1);
  const maxBrandCount = Math.max(...Object.values(brandCounts), 1);

  const periodLabel = period === "week" ? "últimos 7 días" : period === "month" ? "último mes" : "último año";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Reportes
          </h2>
          <p className="text-gray-500 text-sm mt-1">Estadísticas del taller</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p === "week" ? "7 días" : p === "month" ? "Mes" : "Año"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Órdenes</p>
              <p className="text-xl font-bold text-gray-900">{periodOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2.5 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ingresos Est.</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalRevenue.toLocaleString("es-MX")}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2.5 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Entregados</p>
              <p className="text-xl font-bold text-gray-900">
                {deliveredInPeriod.length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2.5 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tiempo Prom.</p>
              <p className="text-xl font-bold text-gray-900">
                {avgRepairTime > 0 ? `${avgRepairTime}d` : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Órdenes por Estado ({periodLabel})
          </h3>
          <div className="space-y-3">
            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((status) => {
              const count = statusCounts[status] || 0;
              const pct = maxStatusCount > 0 ? (count / maxStatusCount) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{STATUS_CONFIG[status].label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Types */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Tipo de Equipo ({periodLabel})
          </h3>
          {Object.keys(deviceTypeCounts).length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(deviceTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct = (count / maxDeviceCount) * 100;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{type}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Brand Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Marca de Equipo ({periodLabel})
          </h3>
          {Object.keys(brandCounts).length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(brandCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([brand, count]) => {
                  const pct = (count / maxBrandCount) * 100;
                  return (
                    <div key={brand}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{brand}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Revenue by delivered */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Resumen Financiero ({periodLabel})
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Ingresos estimados totales</span>
              <span className="font-bold text-lg">${totalRevenue.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Ingresos entregados</span>
              <span className="font-bold text-lg text-green-700">
                ${deliveredRevenue.toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">Ticket promedio</span>
              <span className="font-bold text-lg text-blue-700">
                ${periodOrders.length > 0 ? Math.round(totalRevenue / periodOrders.length).toLocaleString("es-MX") : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Profit Tracking */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Ganancias ({periodLabel})
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-600">Costo de piezas</span>
              <span className="font-bold text-lg text-red-600">-${totalPartsCost.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-gray-600">Mano de obra</span>
              <span className="font-bold text-lg text-orange-600">-${totalLaborCost.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <span className="text-sm font-medium text-gray-700">Ganancia estimada</span>
              <span className={`font-bold text-xl ${totalProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
                ${totalProfit.toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm text-gray-600">Ganancia entregados</span>
              <span className={`font-bold text-lg ${deliveredProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                ${deliveredProfit.toLocaleString("es-MX")}
              </span>
            </div>
            {totalRevenue > 0 && (
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-600">Margen de ganancia</span>
                <span className="font-bold text-lg text-purple-700">
                  {Math.round((totalProfit / totalRevenue) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
