"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEVICE_TYPES, DEVICE_BRANDS, STATUS_CONFIG, ServiceOrder } from "@/types/order";
import { Save, ArrowLeft, Printer, CheckCircle, Eye, MessageCircle, PlusCircle } from "lucide-react";
import { formatMoney } from "@/lib/currencies";
import Link from "next/link";
import { SignaturePad } from "@/components/signature-pad";
import { PhotoUpload } from "@/components/photo-upload";

export default function NuevaOrdenPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [currency, setCurrency] = useState("MXN");

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
    estimatedCost: 0,
    partsCost: 0,
    laborCost: 0,
    estimatedDelivery: "",
    signature: "",
    devicePhotos: [] as string[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["estimatedCost", "partsCost", "laborCost"].includes(name) ? Number(value) : value,
    }));
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
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error al guardar");

      const order = await res.json();
      setCreatedOrder(order);
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
${o.estimatedCost > 0 ? `<div class="divider"></div><div class="row"><span class="label">Costo Estimado:</span><span class="value">${formatMoney(o.estimatedCost, currency)}</span></div>` : ""}
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

  const sendWhatsAppCreated = () => {
    if (!createdOrder) return;
    fetch("/api/settings").then(r => r.json()).then((s) => {
      const template = s.whatsappTemplateCreated || "Hola {nombre}, su equipo {equipo} ha sido recibido. Orden: {orden}.";
      const msg = template
        .replace("{nombre}", createdOrder.customerName)
        .replace("{equipo}", `${createdOrder.deviceBrand} ${createdOrder.deviceType}`)
        .replace("{orden}", createdOrder.orderNumber);
      const phone = createdOrder.customerPhone.replace(/\D/g, "");
      const fullPhone = phone.startsWith("52") ? phone : `52${phone}`;
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                className="input-field"
                placeholder="(123) 456-7890"
              />
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo estimado
                </label>
                <input
                  type="number"
                  name="estimatedCost"
                  value={form.estimatedCost || ""}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo de piezas
                </label>
                <input
                  type="number"
                  name="partsCost"
                  value={form.partsCost || ""}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mano de obra
                </label>
                <input
                  type="number"
                  name="laborCost"
                  value={form.laborCost || ""}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            {(form.partsCost > 0 || form.laborCost > 0) && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg text-sm">
                <span className="text-gray-600">Ganancia estimada:</span>
                <span className="font-bold text-green-700">
                  {formatMoney((form.estimatedCost || 0) - (form.partsCost || 0) - (form.laborCost || 0), currency)}
                </span>
              </div>
            )}
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

        {/* Signature */}
        <div className="card">
          <SignaturePad
            onSave={(dataUrl) => setForm((prev) => ({ ...prev, signature: dataUrl }))}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/admin" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
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
