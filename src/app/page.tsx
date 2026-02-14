"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/currencies";
import { STATUS_CONFIG, OrderStatus } from "@/types/order";
import {
  Monitor,
  Search,
  Phone,
  CheckCircle,
  Hash,
  ArrowLeft,
  Eye,
  Shield,
  AlertCircle,
} from "lucide-react";

interface PublicOrder {
  orderNumber: string;
  customerName: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  accessories: string;
  problemDescription: string;
  diagnosis: string;
  estimatedCost: number;
  estimatedDelivery: string;
  status: OrderStatus;
  budgetStatus?: "none" | "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  logoUrl: string;
  currency: string;
  schedule: string;
}

const STATUS_STEPS: OrderStatus[] = [
  "recibido",
  "diagnosticando",
  "reparando",
  "listo",
  "entregado",
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"order" | "phone">("order");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showVerify, setShowVerify] = useState<string | null>(null);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerifyPortal = async (orderNum: string) => {
    if (!verifyPhone.trim()) { setVerifyError("Ingresa tu teléfono"); return; }
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNum, phone: verifyPhone.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setVerifyError(data.error || "Error de verificación");
        return;
      }
      router.push(`/orden/${orderNum}`);
    } catch {
      setVerifyError("Error de conexión");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => {});
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);
    setOrders([]);

    try {
      const res = await fetch(
        `/api/orders/search?q=${encodeURIComponent(query.trim())}&type=${searchType}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "No se encontraron resultados");
        return;
      }
      const data = await res.json();
      if (searchType === "phone") {
        setOrders(Array.isArray(data) ? data : [data]);
      } else {
        setOrder(data);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setOrder(null);
    setOrders([]);
    setError("");
    setQuery("");
  };

  const currentStepIndex = order
    ? STATUS_STEPS.indexOf(order.status)
    : -1;

  const hasResults = order || orders.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      {/* Logo + Name */}
      <div className="pt-8 pb-4 text-center">
        <div className="flex items-center justify-center gap-3">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
          ) : (
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-md shadow-primary-200">
              <Monitor className="h-6 w-6 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900">
            {settings?.businessName || "Mi Taller"}
          </h1>
        </div>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">

          {/* Search View */}
          {!hasResults && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-2">
                Consulta tu Orden
              </h2>
              <p className="text-gray-400 text-sm text-center mb-8">
                Ingresa tu número de orden o teléfono para ver el estado de tu equipo
              </p>

              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => { setSearchType("order"); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      searchType === "order" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Hash className="h-3.5 w-3.5" />
                    N° de Orden
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchType("phone"); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      searchType === "phone" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Teléfono
                  </button>
                </div>

                <form onSubmit={handleSearch} className="space-y-3">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchType === "order" ? "Ej: ORD-202602-0001" : "Ej: (123) 456-7890"}
                    className="input-field text-center text-base"
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Buscar
                      </>
                    )}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Single Order Result */}
          {order && (
            <div>
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-600 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Buscar otra orden
              </button>

              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-400">Orden</p>
                    <p className="text-lg font-bold text-gray-900">{order.orderNumber}</p>
                  </div>
                  <span className={`status-badge ${STATUS_CONFIG[order.status].bgColor} ${STATUS_CONFIG[order.status].color}`}>
                    {STATUS_CONFIG[order.status].label}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="mb-5">
                  <div className="flex items-center justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      return (
                        <div key={step} className="flex-1 flex flex-col items-center relative">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                              isCompleted
                                ? "bg-primary-600 text-white"
                                : "bg-gray-200 text-gray-400"
                            } ${isCurrent ? "ring-4 ring-primary-100" : ""}`}
                          >
                            {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                          </div>
                          <p className={`text-[10px] mt-1.5 text-center leading-tight ${
                            isCompleted ? "text-primary-600 font-medium" : "text-gray-400"
                          }`}>
                            {STATUS_CONFIG[step].label}
                          </p>
                          {index < STATUS_STEPS.length - 1 && (
                            <div className={`absolute top-4 left-[55%] w-[90%] h-0.5 ${
                              index < currentStepIndex ? "bg-primary-600" : "bg-gray-200"
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cliente</span>
                    <span className="font-medium text-gray-900">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Equipo</span>
                    <span className="font-medium text-gray-900">
                      {order.deviceBrand} {order.deviceModel || ""} - {order.deviceType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Problema</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">{order.problemDescription}</span>
                  </div>
                  {order.diagnosis && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Diagnóstico</span>
                      <span className="font-medium text-gray-900 text-right max-w-[60%]">{order.diagnosis}</span>
                    </div>
                  )}
                  {order.estimatedCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Costo Estimado</span>
                      <span className="font-semibold text-gray-900">{formatMoney(order.estimatedCost, settings?.currency || "MXN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ingreso</span>
                    <span className="font-medium text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Portal Access Button */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  {order.budgetStatus === "pending" && (
                    <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">Tienes un presupuesto pendiente de aprobación</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setShowVerify(order.orderNumber); setVerifyPhone(""); setVerifyError(""); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Portal Completo
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2">Fotos, historial y aprobación de presupuesto</p>
                </div>
              </div>
            </div>
          )}

          {/* Phone Search Results */}
          {orders.length > 0 && (
            <div>
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-600 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Buscar otra orden
              </button>

              <p className="text-xs text-gray-400 mb-3">
                {orders.length} orden{orders.length !== 1 ? "es" : ""} encontrada{orders.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {orders.map((o) => (
                  <div key={o.orderNumber} className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-900">{o.orderNumber}</p>
                      <span className={`status-badge text-xs ${STATUS_CONFIG[o.status].bgColor} ${STATUS_CONFIG[o.status].color}`}>
                        {STATUS_CONFIG[o.status].label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Equipo</span>
                        <p className="font-medium text-gray-900">{o.deviceBrand} - {o.deviceType}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Costo</span>
                        <p className="font-medium text-gray-900">
                          {o.estimatedCost > 0 ? formatMoney(o.estimatedCost, settings?.currency || "MXN") : "Por determinar"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowVerify(o.orderNumber); setVerifyPhone(query); setVerifyError(""); }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver Portal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {showVerify && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowVerify(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary-100 p-2.5 rounded-xl">
                <Shield className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Verificar identidad</h3>
                <p className="text-xs text-gray-500">Ingresa tu teléfono para acceder</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">Orden: <span className="font-mono font-semibold text-gray-700">{showVerify}</span></p>
            <input
              type="tel"
              value={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyPortal(showVerify)}
              placeholder="Teléfono registrado"
              className="input-field text-center mb-3"
              autoFocus
            />
            {verifyError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg mb-3 text-center">{verifyError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowVerify(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleVerifyPortal(showVerify)}
                disabled={verifying}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Acceder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <div className="py-4 text-center text-xs text-gray-300">
        &copy; {new Date().getFullYear()} {settings?.businessName || "Mi Taller"}
      </div>
    </div>
  );
}
