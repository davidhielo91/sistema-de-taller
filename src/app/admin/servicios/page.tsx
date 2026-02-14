"use client";

import { useEffect, useState } from "react";
import { Wrench, Plus, Trash2, Package } from "lucide-react";
import { formatMoneyShort, getCurrency } from "@/lib/currencies";

interface ServiceItem {
  id: string;
  name: string;
  basePrice: number;
  linkedPartId?: string;
  linkedPartName?: string;
  linkedPartCost?: number;
}

interface PartItem {
  id: string;
  name: string;
  cost: number;
  stock: number;
}

export default function ServiciosPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [availableParts, setAvailableParts] = useState<PartItem[]>([]);
  const [currency, setCurrency] = useState("MXN");
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newPartId, setNewPartId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then(r => r.json()).catch(() => []),
      fetch("/api/parts").then(r => r.json()).catch(() => []),
      fetch("/api/settings").then(r => r.json()).catch(() => ({})),
    ]).then(([servicesData, partsData, settings]) => {
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setAvailableParts(Array.isArray(partsData) ? partsData : []);
      if (settings?.currency) setCurrency(settings.currency);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const addService = async () => {
    if (!newName.trim() || newPrice <= 0) return;
    const linkedPart = availableParts.find(p => p.id === newPartId);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          basePrice: newPrice,
          linkedPartId: linkedPart?.id || undefined,
          linkedPartName: linkedPart?.name || undefined,
          linkedPartCost: linkedPart?.cost || undefined,
        }),
      });
      if (res.ok) {
        const svc = await res.json();
        setServices([...services, svc]);
        setNewName("");
        setNewPrice(0);
        setNewPartId("");
      }
    } catch {}
  };

  const removeService = async (id: string) => {
    const svc = services.find(s => s.id === id);
    if (!confirm(`¿Eliminar el servicio "${svc?.name || ""}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) setServices(services.filter(s => s.id !== id));
    } catch {}
  };

  const totalRevenue = services.reduce((s, svc) => s + svc.basePrice, 0);
  const withParts = services.filter(s => s.linkedPartId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          Catálogo de Servicios
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Define los servicios que ofreces con su precio al cliente
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{services.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Servicios</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{withParts.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Con pieza</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{formatMoneyShort(totalRevenue, currency)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Valor total</p>
        </div>
      </div>

      {/* Add New Service */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Servicio
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-field flex-1"
              placeholder="Ej: Formateo, Cambio de pantalla..."
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">{getCurrency(currency).symbol}</span>
              <input
                type="text"
                inputMode="decimal"
                value={newPrice || ""}
                onChange={(e) => setNewPrice(Number(e.target.value.replace(/[^0-9.]/g, "")))}
                className="input-field pl-10 w-32"
                placeholder="Precio"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
            <select
              value={newPartId}
              onChange={(e) => setNewPartId(e.target.value)}
              className="input-field flex-1 text-sm"
            >
              <option value="">Sin pieza vinculada (opcional)</option>
              {availableParts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — Costo: {formatMoneyShort(p.cost, currency)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addService}
              disabled={!newName.trim() || newPrice <= 0}
              className="btn-primary px-4 py-2 shrink-0 flex items-center gap-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Vincula una pieza del inventario para calcular ganancia automáticamente y descontar stock.
          </p>
        </div>
      </div>

      {/* Services List */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">
          Servicios ({services.length})
        </h3>
        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Wrench className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay servicios configurados</p>
            <p className="text-xs mt-1">Agrega tu primer servicio arriba</p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((svc) => (
              <div key={svc.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 group hover:border-gray-300 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{svc.name}</span>
                    <span className="text-sm text-primary-600 font-semibold">
                      {formatMoneyShort(svc.basePrice, currency)}
                    </span>
                  </div>
                  {svc.linkedPartName && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {svc.linkedPartName} (costo: {formatMoneyShort(svc.linkedPartCost || 0, currency)})
                      <span className="text-emerald-600 font-medium ml-1">
                        Ganancia: {formatMoneyShort(svc.basePrice - (svc.linkedPartCost || 0), currency)}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeService(svc.id)}
                  className="text-gray-300 hover:text-red-500 p-2 transition-colors shrink-0 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
