"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { STATUS_CONFIG, OrderStatus } from "@/types/order";
import { formatMoney } from "@/lib/currencies";
import {
  Monitor,
  CheckCircle,
  Camera,
  Clock,
  FileText,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ClientOrder {
  id: string;
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
  statusHistory: { from: OrderStatus; to: OrderStatus; date: string }[];
  devicePhotos: string[];
  selectedServices?: { name: string; basePrice: number }[];
  budgetStatus: "none" | "pending" | "approved" | "rejected";
  budgetSentAt?: string;
  budgetRespondedAt?: string;
  budgetNote?: string;
  clientNote?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STEPS: OrderStatus[] = [
  "recibido",
  "diagnosticando",
  "reparando",
  "listo",
  "entregado",
];

export default function ClientPortalPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<ClientOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [businessName, setBusinessName] = useState("Mi Taller");
  const [logoUrl, setLogoUrl] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [clientNote, setClientNote] = useState("");
  const [budgetSuccess, setBudgetSuccess] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/portal/${orderNumber}`).then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      }),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([data, settings]) => {
        setOrder(data);
        if (settings?.currency) setCurrency(settings.currency);
        if (settings?.businessName) setBusinessName(settings.businessName);
        if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
        setLoading(false);
      })
      .catch(() => {
        setError("unauthorized");
        setLoading(false);
      });
  }, [orderNumber]);

  const handleBudgetAction = async (action: "approve" | "reject") => {
    if (!order) return;
    if (action === "approve") setApproving(true);
    else setRejecting(true);

    try {
      const res = await fetch(`/api/orders/${order.id}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, clientNote: clientNote.trim() || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrder({ ...order, budgetStatus: data.budgetStatus, budgetRespondedAt: new Date().toISOString(), clientNote: clientNote.trim() || undefined });
        setBudgetSuccess(action === "approve" ? "Presupuesto aprobado correctamente" : "Presupuesto rechazado. El taller será notificado.");
        setClientNote("");
      }
    } catch {
      setBudgetError("Error de conexión. Intenta de nuevo.");
    } finally {
      setApproving(false);
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error === "unauthorized" || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Sesión expirada</h2>
          <p className="text-sm text-gray-500 mb-6">
            Por seguridad, necesitas verificar tu identidad nuevamente.
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const photos = order.devicePhotos || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-7 w-7 rounded-lg object-contain" />
            ) : (
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <Monitor className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-semibold text-sm text-gray-900">{businessName}</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Order Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400">Orden de Servicio</p>
            <span className={`status-badge ${STATUS_CONFIG[order.status].bgColor} ${STATUS_CONFIG[order.status].color}`}>
              {STATUS_CONFIG[order.status].label}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 font-mono">{order.orderNumber}</p>
          <p className="text-sm text-gray-500 mt-1">
            Hola <span className="font-medium text-gray-700">{order.customerName}</span>, aquí puedes ver el estado de tu equipo.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Progreso</h3>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isCompleted
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    } ${isCurrent ? "ring-4 ring-primary-100 scale-110" : ""}`}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                  </div>
                  <p className={`text-[9px] mt-1.5 text-center leading-tight ${
                    isCompleted ? "text-primary-600 font-semibold" : "text-gray-400"
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

        {/* Budget Approval */}
        {order.budgetStatus === "pending" && (
          <div className="bg-amber-50 rounded-2xl p-5 shadow-sm border-2 border-amber-200">
            <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Presupuesto pendiente de aprobación
            </h3>
            {order.budgetNote && (
              <p className="text-sm text-amber-700 mb-3 bg-amber-100/50 rounded-lg p-3">
                {order.budgetNote}
              </p>
            )}

            {/* Services breakdown */}
            {order.selectedServices && order.selectedServices.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {order.selectedServices.map((svc, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{svc.name}</span>
                    <span className="font-medium text-gray-900">{formatMoney(svc.basePrice, currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-amber-300">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatMoney(order.estimatedCost, currency)}</span>
                </div>
              </div>
            )}

            {!order.selectedServices?.length && order.estimatedCost > 0 && (
              <div className="flex justify-between text-sm font-bold mb-3 bg-amber-100/50 rounded-lg p-3">
                <span className="text-gray-900">Costo estimado</span>
                <span className="text-gray-900">{formatMoney(order.estimatedCost, currency)}</span>
              </div>
            )}

            {budgetError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center font-medium mb-3">
                {budgetError}
              </div>
            )}
            {budgetSuccess ? (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center font-medium">
                {budgetSuccess}
              </div>
            ) : (
              <>
                <textarea
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  placeholder="Comentario opcional..."
                  rows={2}
                  className="input-field text-sm mb-3 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBudgetAction("approve")}
                    disabled={approving || rejecting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {approving ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ThumbsUp className="h-4 w-4" />
                    )}
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleBudgetAction("reject")}
                    disabled={approving || rejecting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors text-sm disabled:opacity-50"
                  >
                    {rejecting ? (
                      <div className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ThumbsDown className="h-4 w-4" />
                    )}
                    Rechazar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {order.budgetStatus === "approved" && (
          <div className="bg-green-50 rounded-2xl p-4 border border-green-200 flex items-center gap-3">
            <ThumbsUp className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Presupuesto aprobado</p>
              <p className="text-xs text-green-600">
                {order.budgetRespondedAt && new Date(order.budgetRespondedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {order.budgetStatus === "rejected" && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200 flex items-center gap-3">
            <ThumbsDown className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Presupuesto rechazado</p>
              {order.clientNote && <p className="text-xs text-red-600 mt-0.5">{order.clientNote}</p>}
            </div>
          </div>
        )}

        {/* Device Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Detalles del Equipo</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Equipo</span>
              <span className="font-medium text-gray-900">{order.deviceBrand} {order.deviceType}</span>
            </div>
            {order.deviceModel && (
              <div className="flex justify-between">
                <span className="text-gray-400">Modelo</span>
                <span className="font-medium text-gray-900">{order.deviceModel}</span>
              </div>
            )}
            {order.accessories && (
              <div className="flex justify-between">
                <span className="text-gray-400">Accesorios</span>
                <span className="font-medium text-gray-900 text-right max-w-[60%]">{order.accessories}</span>
              </div>
            )}
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
            {order.estimatedCost > 0 && order.budgetStatus === "none" && (
              <div className="flex justify-between">
                <span className="text-gray-400">Costo</span>
                <span className="font-semibold text-gray-900">{formatMoney(order.estimatedCost, currency)}</span>
              </div>
            )}
            {order.estimatedDelivery && (
              <div className="flex justify-between">
                <span className="text-gray-400">Entrega est.</span>
                <span className="font-medium text-gray-900">
                  {new Date(order.estimatedDelivery + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Ingreso</span>
              <span className="font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Device Photos */}
        {photos.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos del equipo ({photos.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setPhotoIndex(i); setShowPhotoModal(true); }}
                  className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-primary-300 transition-colors"
                >
                  <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historial
            </h3>
            <div className="space-y-3">
              {[...order.statusHistory].reverse().map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  <div className="flex-1 flex items-center gap-1 flex-wrap">
                    <span className={`status-badge text-[10px] ${STATUS_CONFIG[entry.from].bgColor} ${STATUS_CONFIG[entry.from].color}`}>
                      {STATUS_CONFIG[entry.from].label}
                    </span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className={`status-badge text-[10px] ${STATUS_CONFIG[entry.to].bgColor} ${STATUS_CONFIG[entry.to].color}`}>
                      {STATUS_CONFIG[entry.to].label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(entry.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-300">
            &copy; {new Date().getFullYear()} {businessName}
          </p>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && photos.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setShowPhotoModal(false)}>
          <button
            onClick={() => setShowPhotoModal(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold z-10"
          >
            ✕
          </button>
          <div className="relative w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <img src={photos[photoIndex]} alt={`Foto ${photoIndex + 1}`} className="w-full rounded-xl" />
            {photos.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                <button
                  onClick={() => setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)}
                  className="bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
                  className="bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
            <p className="text-center text-white/60 text-xs mt-2">
              {photoIndex + 1} de {photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
