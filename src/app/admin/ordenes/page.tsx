"use client";

import { useEffect, useState } from "react";
import { ServiceOrder, STATUS_CONFIG, OrderStatus } from "@/types/order";
import Link from "next/link";
import { Search, Trash2, Eye, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { formatMoneyShort } from "@/lib/currencies";

const PAGE_SIZE = 20;

export default function OrdenesPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState("MXN");

  useEffect(() => {
    fetchOrders();
    fetch("/api/settings").then(r => r.json()).then(s => { if (s?.currency) setCurrency(s.currency); }).catch(() => {});
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, orderNumber: string) => {
    if (!confirm(`¿Eliminar la orden ${orderNumber}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      }
    } catch {
      alert("Error al eliminar la orden");
    }
  };

  const filtered = orders
    .filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(term) ||
          o.customerName.toLowerCase().includes(term) ||
          o.customerPhone.includes(term) ||
          o.deviceBrand.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const exportCSV = () => {
    const headers = ["Orden", "Cliente", "Teléfono", "Email", "Tipo", "Marca", "Modelo", "N/Serie", "Accesorios", "Problema", "Diagnóstico", "Costo", "Estado", "Fecha Creación"];
    const rows = filtered.map((o) => [
      o.orderNumber,
      o.customerName,
      o.customerPhone,
      o.customerEmail,
      o.deviceType,
      o.deviceBrand,
      o.deviceModel || "",
      o.serialNumber || "",
      o.accessories || "",
      `"${(o.problemDescription || "").replace(/"/g, '""')}"`,
      `"${(o.diagnosis || "").replace(/"/g, '""')}"`,
      o.estimatedCost || 0,
      STATUS_CONFIG[o.status]?.label || o.status,
      new Date(o.createdAt).toLocaleDateString("es-MX"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordenes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Todas las Órdenes</h2>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length} orden{orders.length !== 1 ? "es" : ""} en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2" title="Exportar CSV">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <Link href="/admin/nueva-orden" className="btn-primary w-fit">
            + Nueva Orden
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por orden, cliente, teléfono o marca..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">Todos los estados</option>
              {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-lg">No se encontraron órdenes</p>
          <p className="text-sm mt-1">Intenta con otros filtros o crea una nueva orden</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Orden</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Cliente</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold hidden md:table-cell">Teléfono</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold hidden lg:table-cell">Equipo</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">Estado</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold hidden sm:table-cell">Costo</th>
                <th className="text-left py-3 px-4 text-gray-600 font-semibold hidden lg:table-cell">Fecha</th>
                <th className="text-right py-3 px-4 text-gray-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs font-semibold text-primary-600">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {order.customerName}
                  </td>
                  <td className="py-3 px-4 text-gray-500 hidden md:table-cell">
                    {order.customerPhone}
                  </td>
                  <td className="py-3 px-4 text-gray-500 hidden lg:table-cell">
                    {order.deviceBrand} {order.deviceType}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${STATUS_CONFIG[order.status].bgColor} ${STATUS_CONFIG[order.status].color}`}>
                      {STATUS_CONFIG[order.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 hidden sm:table-cell">
                    {order.estimatedCost > 0
                      ? formatMoneyShort(order.estimatedCost, currency)
                      : "-"}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs hidden lg:table-cell">
                    {new Date(order.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/ordenes/${order.id}`}
                        className="p-2 hover:bg-primary-50 rounded-lg transition-colors text-gray-500 hover:text-primary-600"
                        title="Ver / Editar"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(order.id, order.orderNumber)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-300">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      p === page ? "bg-primary-600 text-white" : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
