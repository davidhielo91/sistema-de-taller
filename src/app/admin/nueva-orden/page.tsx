"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEVICE_TYPES, DEVICE_BRANDS, STATUS_CONFIG, ServiceOrder } from "@/types/order";
import { Save, ArrowLeft, Printer, CheckCircle, Eye, MessageCircle, PlusCircle, Plus, Trash2, FileDown, Wrench } from "lucide-react";
import { formatMoney, formatMoneyShort, getCurrency } from "@/lib/currencies";
import Link from "next/link";
import { SignaturePad } from "@/components/signature-pad";
import { PhotoUpload } from "@/components/photo-upload";

export default function NuevaOrdenPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [currency, setCurrency] = useState("MXN");
  const [availableServices, setAvailableServices] = useState<{id:string;name:string;basePrice:number;linkedPartId?:string;linkedPartName?:string;linkedPartCost?:number}[]>([]);
  const [selectedServices, setSelectedServices] = useState<{id:string;name:string;basePrice:number;linkedPartId?:string;linkedPartName?:string;linkedPartCost?:number}[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    serialNumber: "",
    accessories: "",
    problemDescription: "",
    diagnosis: "",
    estimatedDelivery: "",
    manualCost: 0,
    devicePhotos: [] as string[],
    internalNotes: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/services").then(r => r.json()).catch(() => []),
    ]).then(([settings, servicesData]) => {
      setAvailableServices(Array.isArray(servicesData) ? servicesData : []);
      if (settings?.currency) setCurrency(settings.currency);
    }).catch(() => {});

    // Load draft from localStorage
    const draft = localStorage.getItem('orderDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.form) setForm(parsed.form);
        if (parsed.selectedServices) setSelectedServices(parsed.selectedServices);
      } catch {}
    }
  }, []);

  // Autosave draft every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.customerName || form.customerPhone || form.problemDescription) {
        localStorage.setItem('orderDraft', JSON.stringify({ form, selectedServices }));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [form, selectedServices]);

  const addService = () => {
    const svc = availableServices.find(s => s.id === selectedServiceId);
    if (!svc || selectedServices.find(s => s.id === svc.id)) return;
    setSelectedServices([...selectedServices, svc]);
    setSelectedServiceId("");
  };

  const removeService = (id: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id));
  };

  const servicesTotalPrice = selectedServices.reduce((s, sv) => s + sv.basePrice, 0);
  const servicesPartsCost = selectedServices.reduce((s, sv) => s + (sv.linkedPartCost || 0), 0);
  const servicesProfit = servicesTotalPrice - servicesPartsCost;

  const searchCustomerByPhone = async (phone: string) => {
    if (!phone || phone.length < 4) return;
    setSearchingCustomer(true);
    try {
      const res = await fetch(`/api/orders/search?phone=${phone}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          const customers = data.orders.reduce((acc: any[], order: any) => {
            if (!acc.find(c => c.phone === order.customerPhone)) {
              acc.push({
                name: order.customerName,
                phone: order.customerPhone,
                email: order.customerEmail || "",
              });
            }
            return acc;
          }, []);
          setCustomerSuggestions(customers);
        } else {
          setCustomerSuggestions([]);
        }
      }
    } catch {
      setCustomerSuggestions([]);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const selectCustomer = (customer: any) => {
    setForm((prev) => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
    }));
    setCustomerSuggestions([]);
    setPhoneError("");
  };

  const clearDraft = () => {
    localStorage.removeItem('orderDraft');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "manualCost" ? Number(value) : value }));
    
    if (name === "customerPhone") {
      const cleaned = value.replace(/\D/g, "");
      if (value && cleaned.length < 4) {
        setPhoneError("Ingresa al menos 4 dígitos");
        setCustomerSuggestions([]);
      } else {
        setPhoneError("");
        if (cleaned.length >= 4) {
          searchCustomerByPhone(cleaned);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.deviceType || !form.problemDescription) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          manualCost: undefined,
          selectedServices,
          estimatedCost: selectedServices.length > 0 ? servicesTotalPrice : (form.manualCost || 0),
          partsCost: selectedServices.length > 0 ? servicesPartsCost : 0,
          internalNotes: form.internalNotes ? [{ text: form.internalNotes, date: new Date().toISOString() }] : [],
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      const order = await res.json();
      setCreatedOrder(order);
      clearDraft();
      setSaving(false);
    } catch {
      setError("Error al crear la orden. Intenta de nuevo.");
      setSaving(false);
    }
  };

  const handlePrintCreated = async () => {
    if (!createdOrder) return;
    const o = createdOrder;
    const s = await fetch("/api/settings").then(r => r.json()).catch(() => ({}));
    if (s?.currency) setCurrency(s.currency);
    const bName = s.businessName || "Mi Taller";
    const bInfo = [s.address, s.phone].filter(Boolean).join(" | Tel: ");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Recibo ${o.orderNumber}</title>
<style>body{font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;font-size:14px}
h1{text-align:center;font-size:18px;margin-bottom:4px}h2{text-align:center;font-size:12px;color:#666;font-weight:normal;margin-top:0}
.divider{border-top:1px dashed #ccc;margin:12px 0}.row{display:flex;justify-content:space-between;margin:6px 0}
.label{color:#666}.value{font-weight:bold;text-align:right}.big{font-size:20px;text-align:center;margin:12px 0;letter-spacing:2px}
.status{background:#eee;padding:6px 12px;border-radius:4px;text-align:center;font-weight:bold;margin:12px 0}
.footer{text-align:center;color:#999;font-size:11px;margin-top:20px}
.terms{margin-top:16px;padding-top:12px;border-top:1px dashed #ccc;font-size:9px;color:#999;line-height:1.4}</style></head><body>
<h1>${bName}</h1>${bInfo ? `<h2>${bInfo}</h2>` : ""}
<div class="divider"></div>
<div class="big">${o.orderNumber}</div>
<div class="status">Recibido</div>
<div class="divider"></div>
<div class="row"><span class="label">Cliente:</span><span class="value">${o.customerName}</span></div>
<div class="row"><span class="label">Teléfono:</span><span class="value">${o.customerPhone}</span></div>
<div class="row"><span class="label">Equipo:</span><span class="value">${o.deviceBrand} ${o.deviceType}</span></div>
${o.deviceModel ? `<div class="row"><span class="label">Modelo:</span><span class="value">${o.deviceModel}</span></div>` : ""}
${o.serialNumber ? `<div class="row"><span class="label">N/S:</span><span class="value">${o.serialNumber}</span></div>` : ""}
${o.accessories ? `<div class="row"><span class="label">Accesorios:</span><span class="value">${o.accessories}</span></div>` : ""}
<div class="divider"></div>
<div class="row"><span class="label">Problema:</span></div>
<div>${o.problemDescription}</div>
${selectedServices.length > 0 ? `<div class="divider"></div><div style="margin:6px 0"><span class="label">Servicios:</span></div>${selectedServices.map(sv => `<div class="row"><span style="font-size:12px">${sv.name}</span><span class="value">${formatMoney(sv.basePrice, currency)}</span></div>`).join("")}<div class="divider"></div><div class="row"><span class="label"><strong>Total:</strong></span><span class="value"><strong>${formatMoney(servicesTotalPrice, currency)}</strong></span></div>` : (o.estimatedCost > 0 ? `<div class="divider"></div><div class="row"><span class="label">Costo Estimado:</span><span class="value">${formatMoney(o.estimatedCost, currency)}</span></div>` : "")}
<div class="divider"></div>
<div class="row"><span class="label">Fecha:</span><span class="value">${new Date(o.createdAt).toLocaleDateString("es-MX")}</span></div>
<div class="footer"><p>Consulte el estado de su orden en línea con el número de orden mostrado arriba.</p><p>Gracias por su preferencia.</p></div>
<div class="terms"><strong>TÉRMINOS Y CONDICIONES:</strong><br>
1. El equipo no reclamado después de 30 días de notificado como listo se cobrará almacenaje.<br>
2. La garantía de reparación es de 30 días a partir de la fecha de entrega.<br>
3. No nos hacemos responsables por datos almacenados en el equipo.<br>
4. El costo estimado puede variar según el diagnóstico final.<br>
5. Este comprobante es necesario para recoger el equipo.</div>
</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSavePDF = async () => {
    if (!createdOrder) return;
    const o = createdOrder;
    const s = await fetch("/api/settings").then(r => r.json()).catch(() => ({}));
    const cur = s?.currency || currency;
    const bName = s.businessName || "Mi Taller";
    const bInfo = [s.address, s.phone].filter(Boolean).join(" | Tel: ");

    const container = document.createElement("div");
    container.innerHTML = `<div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;font-size:14px">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">${bName}</h1>
${bInfo ? `<h2 style="text-align:center;font-size:12px;color:#666;font-weight:normal;margin-top:0">${bInfo}</h2>` : ""}
<div style="border-top:1px dashed #ccc;margin:12px 0"></div>
<div style="font-size:20px;text-align:center;margin:12px 0;letter-spacing:2px;font-weight:bold">${o.orderNumber}</div>
<div style="background:#eee;padding:6px 12px;border-radius:4px;text-align:center;font-weight:bold;margin:12px 0">Recibido</div>
<div style="border-top:1px dashed #ccc;margin:12px 0"></div>
<div style="display:flex;justify-content:space-between;margin:6px 0"><span style="color:#666">Cliente:</span><span style="font-weight:bold;text-align:right">${o.customerName}</span></div>
<div style="display:flex;justify-content:space-between;margin:6px 0"><span style="color:#666">Teléfono:</span><span style="font-weight:bold;text-align:right">${o.customerPhone}</span></div>
<div style="display:flex;justify-content:space-between;margin:6px 0"><span style="color:#666">Equipo:</span><span style="font-weight:bold;text-align:right">${o.deviceBrand} ${o.deviceType}</span></div>
${o.deviceModel ? `<div style="display:flex;justify-content:space-between;margin:6px 0"><span style="color:#666">Modelo:</span><span style="font-weight:bold;text-align:right">${o.deviceModel}</span></div>` : ""}
${o.serialNumber ? `<div style="display:flex;justify-content:space-between;margin:6px 0"><span style="color:#666">N/S:</span><span style="font-weight:bold;text-align:right">${o.serialNumber}</span></div>` : ""}
${o.accessories ? `<div style="display:flex;justify-content:space-between;margin:6px 0"><span style="color:#666">Accesorios:</span><span style="font-weight:bold;text-align:right">${o.accessories}</span></div>` : ""}
<div style="border-top:1px dashed #ccc;margin:12px 0"></div>
<div style="margin:6px 0"><span style="color:#666">Problema:</span></div>
<div>${o.problemDescription}</div>
${o.estimatedCost > 0 ? `<div style="border-top:1px dashed #ccc;margin:12px 0"></div><div style="display:flex;justify-content:space-between;margin:6px 0"><span style="color:#666">Costo Estimado:</span><span style="font-weight:bold;text-align:right">${formatMoney(o.estimatedCost, cur)}</span></div>` : ""}
<div style="border-top:1px dashed #ccc;margin:12px 0"></div>
<div style="display:flex;justify-content:space-between;margin:6px 0"><span style="color:#666">Fecha:</span><span style="font-weight:bold;text-align:right">${new Date(o.createdAt).toLocaleDateString("es-MX")}</span></div>
<div style="text-align:center;color:#999;font-size:11px;margin-top:20px"><p>Consulte el estado de su orden en línea con el número de orden mostrado arriba.</p><p>Gracias por su preferencia.</p></div>
<div style="margin-top:16px;padding-top:12px;border-top:1px dashed #ccc;font-size:9px;color:#999;line-height:1.4"><strong>TÉRMINOS Y CONDICIONES:</strong><br>
1. El equipo no reclamado después de 30 días de notificado como listo se cobrará almacenaje.<br>
2. La garantía de reparación es de 30 días a partir de la fecha de entrega.<br>
3. No nos hacemos responsables por datos almacenados en el equipo.<br>
4. El costo estimado puede variar según el diagnóstico final.<br>
5. Este comprobante es necesario para recoger el equipo.</div>
</div>`;

    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf()
      .set({
        margin: 10,
        filename: `Recibo-${o.orderNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .save();
  };

  const sendWhatsAppCreated = () => {
    if (!createdOrder) return;
    fetch("/api/settings").then(r => r.json()).then((s) => {
      const template = s.whatsappTemplateCreated || "Hola {nombre}, su equipo {equipo} ha sido recibido. Orden: {orden}.";
      const msg = template
        .replace("{nombre}", createdOrder.customerName)
        .replace("{equipo}", `${createdOrder.deviceBrand} ${createdOrder.deviceType}`)
        .replace("{orden}", createdOrder.orderNumber);
      const cc = s.countryCode || "52";
      const phone = createdOrder.customerPhone.replace(/\D/g, "");
      const fullPhone = phone.startsWith(cc) ? phone : `${cc}${phone}`;
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  };

  if (createdOrder) {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="card text-center">
          <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">¡Orden Creada!</h2>
          <p className="text-3xl font-mono font-bold text-primary-600 my-3 tracking-wider">{createdOrder.orderNumber}</p>
          <p className="text-gray-400 text-sm mb-8">Registrada el {new Date(createdOrder.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p>

          <div className="space-y-3">
            <button
              onClick={handlePrintCreated}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
            >
              <Printer className="h-5 w-5" />
              Imprimir Recibo
            </button>
            <button
              onClick={handleSavePDF}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors text-sm shadow-sm"
            >
              <FileDown className="h-5 w-5" />
              Guardar PDF
            </button>
            <button
              onClick={sendWhatsAppCreated}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 transition-colors text-sm shadow-sm"
            >
              <MessageCircle className="h-5 w-5" />
              Enviar WhatsApp al Cliente
            </button>
            <Link
              href={`/admin/ordenes/${createdOrder.id}`}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors text-sm shadow-sm"
            >
              <Eye className="h-5 w-5" />
              Ver Detalle de Orden
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <Link
              href="/admin/nueva-orden"
              onClick={() => setCreatedOrder(null)}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-600 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Crear otra orden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nueva Orden de Servicio</h2>
          <p className="text-gray-500 text-sm mt-1">
            Completa los datos del cliente y el equipo
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {localStorage.getItem('orderDraft') && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-blue-700">Borrador guardado automáticamente</span>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('orderDraft');
              window.location.reload();
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
          >
            Limpiar borrador
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Datos del Cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                className="input-field"
                placeholder="Juan Pérez"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                className={`input-field ${phoneError ? 'border-red-300' : ''}`}
                placeholder="(123) 456-7890"
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              )}
              {searchingCustomer && (
                <p className="text-xs text-gray-400 mt-1">Buscando clientes...</p>
              )}
              {customerSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customerSuggestions.map((customer, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className="w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleChange}
                className="input-field"
                placeholder="juan@email.com"
              />
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Datos del Equipo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de equipo <span className="text-red-500">*</span>
              </label>
              <select
                name="deviceType"
                value={form.deviceType}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                {DEVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <select
                name="deviceBrand"
                value={form.deviceBrand}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                {DEVICE_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                name="deviceModel"
                value={form.deviceModel}
                onChange={handleChange}
                className="input-field"
                placeholder="Ej: Pavilion 15, Inspiron 3520"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de serie
              </label>
              <input
                type="text"
                name="serialNumber"
                value={form.serialNumber}
                onChange={handleChange}
                className="input-field"
                placeholder="S/N del equipo"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accesorios recibidos
              </label>
              <input
                type="text"
                name="accessories"
                value={form.accessories}
                onChange={handleChange}
                className="input-field"
                placeholder="Cargador, mouse, funda, etc."
              />
            </div>
          </div>
        </div>

        {/* Device Photos */}
        <div className="card">
          <PhotoUpload
            photos={form.devicePhotos}
            onChange={(photos) => setForm((prev) => ({ ...prev, devicePhotos: photos }))}
          />
        </div>

        {/* Problem & Diagnosis */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Problema y Diagnóstico</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del problema <span className="text-red-500">*</span>
              </label>
              <textarea
                name="problemDescription"
                value={form.problemDescription}
                onChange={handleChange}
                rows={3}
                className="input-field resize-none"
                placeholder="Describe el problema que reporta el cliente..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnóstico inicial
              </label>
              <textarea
                name="diagnosis"
                value={form.diagnosis}
                onChange={handleChange}
                rows={3}
                className="input-field resize-none"
                placeholder="Diagnóstico preliminar (opcional)..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                Notas internas
                <span className="text-xs text-gray-400 font-normal">(Solo visible para ti)</span>
              </label>
              <textarea
                name="internalNotes"
                value={form.internalNotes}
                onChange={handleChange}
                rows={2}
                className="input-field resize-none bg-yellow-50 border-yellow-200"
                placeholder="Ej: Cliente difícil, equipo muy golpeado, etc..."
              />
            </div>
            {/* Servicios */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Servicios y Costos
              </h4>
              {availableServices.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="input-field flex-1"
                    >
                      <option value="">Seleccionar servicio...</option>
                      {availableServices
                        .filter(s => !selectedServices.find(ss => ss.id === s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {formatMoneyShort(s.basePrice, currency)}
                          </option>
                        ))}
                    </select>
                    <button type="button" onClick={addService} disabled={!selectedServiceId} className="btn-primary px-3 shrink-0">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {selectedServices.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">Sin servicios seleccionados (opcional)</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedServices.map((svc) => (
                        <div key={svc.id} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{svc.name}</span>
                            <span className="text-sm text-purple-600 font-semibold ml-2">{formatMoneyShort(svc.basePrice, currency)}</span>
                          </div>
                          <button type="button" onClick={() => removeService(svc.id)} className="text-gray-300 hover:text-red-500 p-1">
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
                  {/* Resumen de costos (auto-calculado desde servicios) */}
                  {selectedServices.length > 0 && (
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cobro al cliente:</span>
                        <span className="font-semibold text-gray-900">{formatMoney(servicesTotalPrice, currency)}</span>
                      </div>
                      {servicesPartsCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Costo de piezas:</span>
                          <span className="text-red-600">-{formatMoney(servicesPartsCost, currency)}</span>
                        </div>
                      )}
                      {servicesPartsCost > 0 && (
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                          <span className="font-medium text-gray-700">Ganancia estimada:</span>
                          <span className="font-bold text-green-700">{formatMoney(servicesProfit, currency)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">No hay servicios configurados. Puedes crearlos en <Link href="/admin/configuracion" className="text-primary-600 underline">Configuración</Link>, o ingresa el costo manualmente:</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo estimado al cliente</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">{getCurrency(currency).symbol}</span>
                      <input
                        type="number"
                        name="manualCost"
                        value={form.manualCost || ""}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha estimada de entrega
              </label>
              <input
                type="date"
                name="estimatedDelivery"
                value={form.estimatedDelivery}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Link href="/admin" className="btn-secondary w-full sm:w-auto justify-center">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Guardando..." : "Crear Orden"}
          </button>
        </div>
      </form>
    </div>
  );
}
