"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ServiceOrder,
  STATUS_CONFIG,
  OrderStatus,
  DEVICE_TYPES,
  DEVICE_BRANDS,
  InternalNote,
} from "@/types/order";
import Link from "next/link";
import { ArrowLeft, Save, Copy, Check, Printer, Plus, Trash2, Clock, MessageSquare, MessageCircle, Wrench, FileText, Send, ThumbsUp, ThumbsDown, ChevronDown } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { formatMoney, formatMoneyShort } from "@/lib/currencies";
import { SignaturePad } from "@/components/signature-pad";
import { PhotoUpload } from "@/components/photo-upload";

const ALL_STATUSES: OrderStatus[] = [
  "recibido",
  "diagnosticando",
  "reparando",
  "listo",
  "entregado",
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [budgetNote, setBudgetNote] = useState("");
  const [sendingBudget, setSendingBudget] = useState(false);
  const [availableServices, setAvailableServices] = useState<{id:string;name:string;basePrice:number;linkedPartId?:string;linkedPartName?:string;linkedPartCost?:number}[]>([]);
  const [selectedServices, setSelectedServices] = useState<{id:string;name:string;basePrice:number;linkedPartId?:string;linkedPartName?:string;linkedPartCost?:number}[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/${id}`).then((res) => { if (!res.ok) throw new Error("Not found"); return res.json(); }),
      fetch("/api/settings").then((res) => res.json()),
      fetch("/api/services").then((res) => res.json()).catch(() => []),
    ]).then(([data, settings, servicesData]) => {
      setOrder({ ...data, statusHistory: data.statusHistory || [], internalNotes: data.internalNotes || [], usedParts: data.usedParts || [], devicePhotos: data.devicePhotos || [], budgetStatus: data.budgetStatus || "none" });
      setAvailableServices(Array.isArray(servicesData) ? servicesData : []);
      if (data.selectedServices) setSelectedServices(data.selectedServices);
      if (settings?.currency) setCurrency(settings.currency);
      setLoading(false);
    }).catch(() => {
      setError("Orden no encontrada");
      setLoading(false);
    });
  }, [id]);

  const addServiceToOrder = () => {
    if (!order) return;
    const svc = availableServices.find(s => s.id === selectedServiceId);
    if (!svc || selectedServices.find(s => s.id === svc.id)) return;
    const updated = [...selectedServices, svc];
    setSelectedServices(updated);
    setSelectedServiceId("");
  };

  const removeServiceFromOrder = (svcId: string) => {
    if (!order) return;
    setSelectedServices(selectedServices.filter(s => s.id !== svcId));
  };

  const servicesTotalPrice = selectedServices.reduce((s, sv) => s + sv.basePrice, 0);
  const servicesPartsCost = selectedServices.reduce((s, sv) => s + (sv.linkedPartCost || 0), 0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!order) return;
    const { name, value } = e.target;
    setOrder({
      ...order,
      [name]: value,
    });
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!order) return;
    setOrder({ ...order, status: newStatus });
  };

  const addNote = () => {
    if (!order || !newNote.trim()) return;
    const note: InternalNote = {
      id: uuidv4(),
      text: newNote.trim(),
      date: new Date().toISOString(),
    };
    setOrder({ ...order, internalNotes: [...(order.internalNotes || []), note] });
    setNewNote("");
  };

  const removeNote = (noteId: string) => {
    if (!order) return;
    setOrder({
      ...order,
      internalNotes: (order.internalNotes || []).filter((n) => n.id !== noteId),
    });
  };


  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          selectedServices,
          ...(selectedServices.length > 0 ? { estimatedCost: servicesTotalPrice, partsCost: servicesPartsCost } : {}),
        }),
      });

      if (!res.ok) throw new Error("Error");

      const updated = await res.json();
      setOrder({ ...updated, statusHistory: updated.statusHistory || [], internalNotes: updated.internalNotes || [] });
      setSuccess("Orden actualizada correctamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendWhatsAppReady = () => {
    if (!order) return;
    fetch("/api/settings").then(r => r.json()).then((s) => {
      const template = s.whatsappTemplateReady || "Hola {nombre}, su equipo {equipo} está listo para recoger. Orden: {orden}.";
      const msg = template
        .replace("{nombre}", order.customerName)
        .replace("{equipo}", `${order.deviceBrand} ${order.deviceType}`)
        .replace("{orden}", order.orderNumber);
      const cc = s.countryCode || "52";
      const phone = order.customerPhone.replace(/\D/g, "");
      const fullPhone = phone.startsWith(cc) ? phone : `${cc}${phone}`;
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  };

  const sendBudget = async () => {
    if (!order) return;
    setSendingBudget(true);
    try {
      const cost = selectedServices.length > 0 ? servicesTotalPrice : (order.estimatedCost || 0);
      if (cost <= 0) {
        setError("Agrega servicios o un costo estimado antes de enviar el presupuesto");
        setSendingBudget(false);
        return;
      }
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          selectedServices,
          ...(selectedServices.length > 0 ? { estimatedCost: servicesTotalPrice, partsCost: servicesPartsCost } : {}),
          budgetStatus: "pending",
          budgetSentAt: new Date().toISOString(),
          budgetNote: budgetNote.trim() || undefined,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder({ ...updated, statusHistory: updated.statusHistory || [], internalNotes: updated.internalNotes || [] });
        setSuccess("Presupuesto enviado al portal del cliente");
        setBudgetNote("");
        setTimeout(() => setSuccess(""), 3000);
        // Send WhatsApp with portal link
        const s = await fetch("/api/settings").then(r => r.json()).catch(() => ({}));
        const cc = s.countryCode || "52";
        const phone = order.customerPhone.replace(/\D/g, "");
        const fullPhone = phone.startsWith(cc) ? phone : `${cc}${phone}`;
        const msg = `Hola ${order.customerName}, hemos preparado un presupuesto para tu equipo ${order.deviceBrand} ${order.deviceType}. Por favor revisa y aprueba desde nuestro portal consultando tu orden: ${order.orderNumber}`;
        window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    } catch {
      setError("Error al enviar presupuesto");
    } finally {
      setSendingBudget(false);
    }
  };

  const handlePrint = async () => {
    if (!order) return;
    const s = await fetch("/api/settings").then(r => r.json()).catch(() => ({}));
    const bName = s.businessName || "Mi Taller";
    const bInfo = [s.address, s.phone].filter(Boolean).join(" | Tel: ");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const deliveryStr = order.estimatedDelivery ? new Date(order.estimatedDelivery + "T12:00:00").toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "";
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Recibo ${order.orderNumber}</title>
<style>body{font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;font-size:14px}
h1{text-align:center;font-size:18px;margin-bottom:4px}h2{text-align:center;font-size:12px;color:#666;font-weight:normal;margin-top:0}
.divider{border-top:1px dashed #ccc;margin:12px 0}.row{display:flex;justify-content:space-between;margin:6px 0}
.label{color:#666}.value{font-weight:bold;text-align:right}.big{font-size:20px;text-align:center;margin:12px 0;letter-spacing:2px}
.status{background:#eee;padding:6px 12px;border-radius:4px;text-align:center;font-weight:bold;margin:12px 0}
.footer{text-align:center;color:#999;font-size:11px;margin-top:20px}
.terms{margin-top:16px;padding-top:12px;border-top:1px dashed #ccc;font-size:9px;color:#999;line-height:1.4}</style></head><body>
<h1>${bName}</h1>${bInfo ? `<h2>${bInfo}</h2>` : ""}
<div class="divider"></div>
<div class="big">${order.orderNumber}</div>
<div class="status">${STATUS_CONFIG[order.status].label}</div>
<div class="divider"></div>
<div class="row"><span class="label">Cliente:</span><span class="value">${order.customerName}</span></div>
<div class="row"><span class="label">Teléfono:</span><span class="value">${order.customerPhone}</span></div>
<div class="row"><span class="label">Equipo:</span><span class="value">${order.deviceBrand} ${order.deviceType}</span></div>
${order.deviceModel ? `<div class="row"><span class="label">Modelo:</span><span class="value">${order.deviceModel}</span></div>` : ""}
${order.serialNumber ? `<div class="row"><span class="label">N/S:</span><span class="value">${order.serialNumber}</span></div>` : ""}
${order.accessories ? `<div class="row"><span class="label">Accesorios:</span><span class="value">${order.accessories}</span></div>` : ""}
<div class="divider"></div>
<div class="row"><span class="label">Problema:</span></div>
<div>${order.problemDescription}</div>
${order.diagnosis ? `<div class="divider"></div><div class="row"><span class="label">Diagnóstico:</span></div><div>${order.diagnosis}</div>` : ""}
${selectedServices.length > 0 ? `<div class="divider"></div><div style="margin:6px 0"><span class="label">Servicios:</span></div>${selectedServices.map(sv => `<div class="row"><span style="font-size:12px">${sv.name}</span><span class="value">${formatMoney(sv.basePrice, currency)}</span></div>`).join("")}<div class="divider"></div><div class="row"><span class="label"><strong>Total:</strong></span><span class="value"><strong>${formatMoney(servicesTotalPrice, currency)}</strong></span></div>` : (order.estimatedCost > 0 ? `<div class="divider"></div><div class="row"><span class="label">Costo Estimado:</span><span class="value">${formatMoney(order.estimatedCost, currency)}</span></div>` : "")}
<div class="divider"></div>
<div class="row"><span class="label">Fecha de ingreso:</span><span class="value">${new Date(order.createdAt).toLocaleDateString("es-MX")}</span></div>
${deliveryStr ? `<div class="row"><span class="label">Entrega estimada:</span><span class="value">${deliveryStr}</span></div>` : ""}
<div class="footer"><p>Consulte el estado de su orden en línea con el número de orden mostrado arriba.</p>
<p>Gracias por su preferencia.</p></div>
<div class="terms">
<strong>TÉRMINOS Y CONDICIONES:</strong><br>
1. El equipo no reclamado después de 30 días de notificado como listo se cobrará almacenaje.<br>
2. La garantía de reparación es de 30 días a partir de la fecha de entrega.<br>
3. No nos hacemos responsables por datos almacenados en el equipo. Se recomienda respaldar antes de dejar el equipo.<br>
4. El costo estimado puede variar según el diagnóstico final. Se notificará al cliente antes de proceder.<br>
5. Este comprobante es necesario para recoger el equipo.
</div>
${order.signature ? `<div class="divider"></div><div style="text-align:center"><p style="font-size:10px;color:#999;margin-bottom:4px">Firma del cliente:</p><img src="${order.signature}" style="max-width:200px;max-height:80px" /></div>` : ""}
</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">{error || "Orden no encontrada"}</p>
        <Link href="/admin/ordenes" className="text-primary-600 text-sm font-medium mt-4 inline-block">
          Volver a órdenes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/ordenes" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {order.orderNumber}
              </h2>
              <button onClick={copyOrderNumber} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Copiar número">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            <p className="text-gray-500 text-sm">
              Creada el{" "}
              {new Date(order.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "listo" && (
            <button onClick={sendWhatsAppReady} className="flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors text-sm">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

      {/* Status Selector */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Estado de la Orden</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = order.status === status;
            const requiresApproval = ["reparando", "listo", "entregado"].includes(status);
            const budgetBlocked = requiresApproval && order.budgetStatus !== "none" && order.budgetStatus !== "approved";
            return (
              <button
                key={status}
                onClick={() => !budgetBlocked && handleStatusChange(status)}
                disabled={budgetBlocked}
                title={budgetBlocked ? "Requiere aprobación del presupuesto" : ""}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                  isActive
                    ? `${config.bgColor} ${config.color} border-current`
                    : budgetBlocked
                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {config.label}
                {budgetBlocked && " 🔒"}
              </button>
            );
          })}
        </div>
        {order.budgetStatus === "pending" && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            ⚠️ No puedes avanzar a reparación hasta que el cliente apruebe el presupuesto.
          </p>
        )}
        {order.budgetStatus === "rejected" && (
          <p className="mt-3 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
            ⚠️ El cliente rechazó el presupuesto. Re-envía uno nuevo para poder continuar.
          </p>
        )}
      </div>

      {/* Budget Status */}
      {(order.budgetStatus === "pending" || order.budgetStatus === "approved" || order.budgetStatus === "rejected") && (
        <div className={`card mb-6 ${
          order.budgetStatus === "pending" ? "border-amber-300 bg-amber-50" :
          order.budgetStatus === "approved" ? "border-green-300 bg-green-50" :
          "border-red-300 bg-red-50"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2">
              {order.budgetStatus === "pending" && <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />}
              {order.budgetStatus === "approved" && <ThumbsUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />}
              {order.budgetStatus === "rejected" && <ThumbsDown className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {order.budgetStatus === "pending" && "Presupuesto enviado — esperando aprobación"}
                  {order.budgetStatus === "approved" && "Presupuesto aprobado por el cliente"}
                  {order.budgetStatus === "rejected" && "Presupuesto rechazado por el cliente"}
                </p>
                {order.budgetRespondedAt && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Respondido: {new Date(order.budgetRespondedAt).toLocaleString("es-MX")}
                  </p>
                )}
                {order.clientNote && (
                  <p className="text-xs text-gray-600 mt-1 bg-white/50 rounded p-2">
                    Cliente: &quot;{order.clientNote}&quot;
                  </p>
                )}
              </div>
            </div>
            <span className={`status-badge shrink-0 w-fit ${
              order.budgetStatus === "pending" ? "bg-amber-200 text-amber-800" :
              order.budgetStatus === "approved" ? "bg-green-200 text-green-800" :
              "bg-red-200 text-red-800"
            }`}>
              {order.budgetStatus === "pending" ? "Pendiente" : order.budgetStatus === "approved" ? "Aprobado" : "Rechazado"}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Customer & Device Info - Single Column */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Datos del Cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input type="text" name="customerName" value={order.customerName} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="tel" name="customerPhone" value={order.customerPhone} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="customerEmail" value={order.customerEmail} onChange={handleChange} className="input-field" />
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-4">Datos del Equipo</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de equipo</label>
                <select name="deviceType" value={order.deviceType} onChange={handleChange} className="input-field">
                  <option value="">Seleccionar...</option>
                  {DEVICE_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <select name="deviceBrand" value={order.deviceBrand} onChange={handleChange} className="input-field">
                  <option value="">Seleccionar...</option>
                  {DEVICE_BRANDS.map((b) => (<option key={b} value={b}>{b}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <input type="text" name="deviceModel" value={order.deviceModel || ""} onChange={handleChange} className="input-field" placeholder="Ej: Pavilion 15" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de serie</label>
                <input type="text" name="serialNumber" value={order.serialNumber || ""} onChange={handleChange} className="input-field" placeholder="S/N" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accesorios recibidos</label>
              <input type="text" name="accessories" value={order.accessories || ""} onChange={handleChange} className="input-field" placeholder="Cargador, mouse, funda, etc." />
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del problema</label>
              <textarea name="problemDescription" value={order.problemDescription} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Lo que reporta el cliente..." />
            </div>

            {/* Detailed Diagnosis for Client */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <label className="block text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reporte Detallado para el Cliente
              </label>
              <p className="text-xs text-blue-700 mb-3">
                Este diagnóstico detallado será visible para el cliente en el portal cuando revise el presupuesto. Explica la falla encontrada y qué se necesita hacer.
              </p>
              <textarea 
                name="detailedDiagnosis" 
                value={order.detailedDiagnosis || ""} 
                onChange={handleChange} 
                rows={6} 
                className="input-field resize-none text-sm"
                placeholder="Ejemplo: Se encontró que la tarjeta madre presenta un corto circuito en el sistema de carga. El componente U7400 (chip de carga) está dañado. Se requiere reemplazo del chip mediante técnica de microsoldadura y limpieza profunda del área afectada. También se detectó oxidación en el conector de batería que debe ser tratada..."
              />
            </div>

            {/* Estimated Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha estimada de entrega</label>
              <input type="date" name="estimatedDelivery" value={order.estimatedDelivery || ""} onChange={handleChange} className="input-field" />
            </div>

            {/* Servicios */}
            {availableServices.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Servicios
                </h4>
                <div className="space-y-3">
                  <div className="relative">
                    {showServiceDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowServiceDropdown(false)} />}
                    <button
                      type="button"
                      onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                      className="input-field w-full text-left flex items-center justify-between"
                    >
                      <span className={selectedServiceId ? "text-gray-900" : "text-gray-400"}>
                        {selectedServiceId
                          ? (() => { const s = availableServices.find(sv => sv.id === selectedServiceId); return s ? `${s.name} — ${formatMoneyShort(s.basePrice, currency)}` : "Seleccionar servicio..."; })()
                          : "Seleccionar servicio..."}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showServiceDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {showServiceDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                        {availableServices.filter(s => !selectedServices.find(ss => ss.id === s.id)).length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-400">Todos los servicios ya están agregados</div>
                        ) : (
                          availableServices.filter(s => !selectedServices.find(ss => ss.id === s.id)).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                if (!order) return;
                                if (!selectedServices.find(ss => ss.id === s.id)) {
                                  setSelectedServices([...selectedServices, s]);
                                }
                                setSelectedServiceId("");
                                setShowServiceDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-b-0 flex items-center justify-between"
                            >
                              <span className="text-sm font-medium text-gray-900">{s.name}</span>
                              <span className="text-sm font-semibold text-purple-600">{formatMoneyShort(s.basePrice, currency)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {selectedServices.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">Sin servicios seleccionados</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedServices.map((svc) => (
                        <div key={svc.id} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{svc.name}</span>
                            <span className="text-sm text-purple-600 font-semibold ml-2">{formatMoneyShort(svc.basePrice, currency)}</span>
                          </div>
                          <button type="button" onClick={() => removeServiceFromOrder(svc.id)} className="text-gray-300 hover:text-red-500 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Total servicios:</span>
                        <span className="text-gray-900">{formatMoney(servicesTotalPrice, currency)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resumen de costos */}
            {(selectedServices.length > 0 || (order.estimatedCost || 0) > 0) && (
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    💰 Presupuesto Total
                  </span>
                  <span className="text-2xl font-bold text-green-700">
                    {formatMoney(selectedServices.length > 0 ? servicesTotalPrice : (order.estimatedCost || 0), currency)}
                  </span>
                </div>
                {((selectedServices.length > 0 ? servicesPartsCost : (order.partsCost || 0)) > 0) && (
                  <>
                    <div className="flex justify-between text-sm pt-3 border-t border-green-200">
                      <span className="text-gray-600">Costo de piezas:</span>
                      <span className="text-red-600 font-medium">-{formatMoney(selectedServices.length > 0 ? servicesPartsCost : (order.partsCost || 0), currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="font-semibold text-gray-700">Ganancia neta:</span>
                      <span className="font-bold text-green-700">
                        {formatMoney(
                          selectedServices.length > 0
                            ? servicesTotalPrice - servicesPartsCost
                            : (order.estimatedCost || 0) - (order.partsCost || 0),
                          currency
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Send Budget */}
            {(!order.budgetStatus || order.budgetStatus === "none" || order.budgetStatus === "rejected") && (order.estimatedCost > 0 || selectedServices.length > 0) && (
              <div className="p-5 bg-gradient-to-br from-blue-50 to-primary-50 rounded-xl border-2 border-primary-300 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Send className="h-5 w-5 text-primary-600" />
                  <h3 className="font-bold text-gray-900 text-base">
                    Enviar Presupuesto al Cliente
                  </h3>
                </div>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  📱 El cliente recibirá un WhatsApp con el link al portal donde podrá aprobar o rechazar el presupuesto.
                </p>
                <textarea
                  value={budgetNote}
                  onChange={(e) => setBudgetNote(e.target.value)}
                  placeholder="Nota para el cliente (opcional): ej. Se encontró un problema adicional que requiere atención..."
                  rows={2}
                  className="input-field text-sm mb-4 resize-none"
                />
                <button
                  onClick={sendBudget}
                  disabled={sendingBudget}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-base font-semibold py-3"
                >
                  {sendingBudget ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando presupuesto...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span className="hidden sm:inline">Enviar Presupuesto de {formatMoney(selectedServices.length > 0 ? servicesTotalPrice : (order.estimatedCost || 0), currency)}</span>
                      <span className="sm:hidden">Enviar {formatMoney(selectedServices.length > 0 ? servicesTotalPrice : (order.estimatedCost || 0), currency)}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Helper message when no services/cost */}
            {(!order.budgetStatus || order.budgetStatus === "none") && selectedServices.length === 0 && (order.estimatedCost || 0) === 0 && (
              <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl text-center">
                <p className="text-sm text-amber-800 font-medium mb-1">
                  💡 Agrega servicios o define un costo para enviar el presupuesto
                </p>
                <p className="text-xs text-amber-700">
                  Selecciona servicios arriba o ingresa un monto en &quot;Cobro al cliente&quot;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Device Photos */}
        <div className="card">
          <PhotoUpload
            photos={order.devicePhotos || []}
            onChange={(photos) => order && setOrder({ ...order, devicePhotos: photos })}
          />
        </div>


        {/* Internal Notes */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Notas Internas
          </h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Agregar nota interna..."
                className="input-field flex-1"
              />
              <button onClick={addNote} disabled={!newNote.trim()} className="btn-primary px-3">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {(order.internalNotes || []).length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Sin notas internas</p>
            ) : (
              <div className="space-y-2">
                {[...(order.internalNotes || [])].reverse().map((note) => (
                  <div key={note.id} className="flex items-start justify-between gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div>
                      <p className="text-sm text-gray-800">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(note.date).toLocaleString("es-MX")}
                      </p>
                    </div>
                    <button onClick={() => removeNote(note.id)} className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Signature - Read Only */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Firma del Cliente</h3>
          {order.signature || order.approvalSignature ? (
            <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <img 
                src={order.approvalSignature || order.signature} 
                alt="Firma del cliente" 
                className="max-h-32 mx-auto" 
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                {order.approvalSignature ? "Firmado al aprobar presupuesto" : "Firma de recepción"}
              </p>
            </div>
          ) : (
            <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <p className="text-sm text-gray-400">Sin firma registrada</p>
            </div>
          )}
        </div>

        {/* Status History */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historial de Cambios
          </h3>
          {(order.statusHistory || []).length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Sin cambios de estado registrados</p>
          ) : (
            <div className="space-y-3">
              {[...(order.statusHistory || [])].reverse().map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  <div className="flex-1">
                    <span className={`status-badge ${STATUS_CONFIG[entry.from].bgColor} ${STATUS_CONFIG[entry.from].color} mr-1`}>
                      {STATUS_CONFIG[entry.from].label}
                    </span>
                    <span className="text-gray-400 mx-1">&rarr;</span>
                    <span className={`status-badge ${STATUS_CONFIG[entry.to].bgColor} ${STATUS_CONFIG[entry.to].color}`}>
                      {STATUS_CONFIG[entry.to].label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(entry.date).toLocaleString("es-MX")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6 text-xs text-gray-400 text-right">
        Última actualización: {new Date(order.updatedAt).toLocaleString("es-MX")}
      </div>
    </div>
  );
}
