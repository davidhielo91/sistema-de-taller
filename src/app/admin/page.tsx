"use client";

import { useEffect, useState } from "react";
import { ServiceOrder, STATUS_CONFIG, OrderStatus } from "@/types/order";
import Link from "next/link";
import {
  Inbox,
  Search,
  Wrench,
  CheckCircle,
  Package,
  PlusCircle,
  TrendingUp,
  Clock,
} from "lucide-react";

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  recibido: Inbox,
  diagnosticando: Search,
  reparando: Wrench,
  listo: CheckCircle,
  entregado: Package,
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const activeOrders = orders.filter(
    (o) => o.status !== "entregado"
  );

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            Resumen general del taller
          </p>
        </div>
        <Link href="/admin/nueva-orden" className="btn-primary flex items-center gap-2 w-fit">
          <PlusCircle className="h-4 w-4" />
          Nueva Orden
        </Link>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = STATUS_ICONS[status];
          const count = statusCounts[status] || 0;
          return (
            <div key={status} className="card text-center">
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor} mb-3`}
              >
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-1">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total de Órdenes</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Órdenes Activas</p>
            <p className="text-2xl font-bold text-gray-900">
              {activeOrders.length}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Órdenes Recientes</h3>
          <Link
            href="/admin/ordenes"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todas
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay órdenes registradas</p>
            <Link
              href="/admin/nueva-orden"
              className="text-primary-600 text-sm font-medium mt-2 inline-block"
            >
              Crear primera orden
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">
                    Orden
                  </th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium hidden sm:table-cell">
                    Equipo
                  </th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">
                    Estado
                  </th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium hidden sm:table-cell">
                    Actualizado
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      <Link
                        href={`/admin/ordenes/${order.id}`}
                        className="text-primary-600 font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-gray-700">
                      {order.customerName}
                    </td>
                    <td className="py-3 px-2 text-gray-500 hidden sm:table-cell">
                      {order.deviceBrand} {order.deviceType}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`status-badge ${STATUS_CONFIG[order.status].bgColor} ${STATUS_CONFIG[order.status].color}`}
                      >
                        {STATUS_CONFIG[order.status].label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-400 hidden sm:table-cell">
                      {new Date(order.updatedAt).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
