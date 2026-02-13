"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Pencil, Trash2, AlertTriangle, Search, X, Save } from "lucide-react";
import { formatMoneyShort } from "@/lib/currencies";

interface Part {
  id: string;
  name: string;
  cost: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export default function InventarioPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formName, setFormName] = useState("");
  const [formCost, setFormCost] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(3);
  const [currency, setCurrency] = useState("MXN");

  useEffect(() => {
    Promise.all([
      fetch("/api/parts").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([partsData, settings]) => {
      setParts(Array.isArray(partsData) ? partsData : []);
      setLowStockThreshold(settings.lowStockThreshold || 3);
      if (settings?.currency) setCurrency(settings.currency);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = parts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockParts = parts.filter((p) => p.stock <= lowStockThreshold && p.stock > 0);
  const outOfStockParts = parts.filter((p) => p.stock === 0);

  const openAdd = () => {
    setEditingPart(null);
    setFormName("");
    setFormCost(0);
    setFormStock(0);
    setShowForm(true);
  };

  const openEdit = (part: Part) => {
    setEditingPart(part);
    setFormName(part.name);
    setFormCost(part.cost);
    setFormStock(part.stock);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    try {
      if (editingPart) {
        const res = await fetch(`/api/parts/${editingPart.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, cost: formCost, stock: formStock }),
        });
        const updated = await res.json();
        setParts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const res = await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, cost: formCost, stock: formStock }),
        });
        const created = await res.json();
        setParts((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta pieza del inventario?")) return;
    try {
      await fetch(`/api/parts/${id}`, { method: "DELETE" });
      setParts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Error al eliminar");
    }
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventario de Piezas
          </h2>
          <p className="text-gray-500 text-sm mt-1">{parts.length} piezas registradas</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Pieza
        </button>
      </div>

      {/* Alerts */}
      {(lowStockParts.length > 0 || outOfStockParts.length > 0) && (
        <div className="space-y-2">
          {outOfStockParts.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Sin stock ({outOfStockParts.length})</p>
                <p className="text-xs text-red-600 mt-0.5">{outOfStockParts.map((p) => p.name).join(", ")}</p>
              </div>
            </div>
          )}
          {lowStockParts.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Stock bajo ({lowStockParts.length})</p>
                <p className="text-xs text-yellow-600 mt-0.5">{lowStockParts.map((p) => `${p.name} (${p.stock})`).join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Buscar pieza..."
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pieza</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Costo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    {search ? "Sin resultados" : "No hay piezas registradas"}
                  </td>
                </tr>
              ) : (
                filtered.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{part.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatMoneyShort(part.cost, currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          part.stock === 0
                            ? "bg-red-100 text-red-700"
                            : part.stock <= lowStockThreshold
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {part.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(part)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(part.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPart ? "Editar Pieza" : "Nueva Pieza"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la pieza</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field"
                  placeholder="Ej: Disco SSD 240GB"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo ({currency})</label>
                  <input
                    type="number"
                    value={formCost || ""}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="input-field"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={formStock || ""}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="input-field"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !formName.trim()} className="btn-primary flex items-center gap-2">
                {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
