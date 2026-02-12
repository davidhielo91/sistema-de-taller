"use client";

import { useEffect, useState } from "react";
import { Save, Settings, Download, Database, Lock } from "lucide-react";

interface BusinessSettings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  logoUrl: string;
  brandColor: string;
  lowStockThreshold: number;
  schedule: string;
  whatsappTemplateCreated: string;
  whatsappTemplateReady: string;
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "",
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
    logoUrl: "",
    brandColor: "#2563eb",
    lowStockThreshold: 3,
    schedule: "",
    whatsappTemplateCreated: "",
    whatsappTemplateReady: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Completa todos los campos");
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError("La nueva contraseña debe tener al menos 4 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Error al cambiar la contraseña");
        return;
      }
      setPasswordSuccess("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch {
      setPasswordError("Error al cambiar la contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: name === "lowStockThreshold" ? Number(value) : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setSuccess("Configuración guardada correctamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Error al guardar la configuración");
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configuración
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Datos del negocio que aparecen en el sitio público
        </p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Información del Negocio</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del negocio
            </label>
            <input
              type="text"
              name="businessName"
              value={settings.businessName}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              name="address"
              value={settings.address}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de WhatsApp (con código de país, sin +)
            </label>
            <input
              type="text"
              name="whatsapp"
              value={settings.whatsapp}
              onChange={handleChange}
              className="input-field"
              placeholder="521234567890"
            />
            <p className="text-xs text-gray-400 mt-1">
              Ejemplo: 521234567890 (52 = México, seguido del número)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horario de atención
            </label>
            <textarea
              name="schedule"
              value={settings.schedule}
              onChange={handleChange}
              rows={2}
              className="input-field resize-none"
              placeholder="Lun - Vie: 9:00 - 18:00&#10;Sábado: 9:00 - 14:00"
            />
            <p className="text-xs text-gray-400 mt-1">
              Una línea por cada horario. Se muestra en la página pública.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del Logo (opcional)
            </label>
            <input
              type="url"
              name="logoUrl"
              value={settings.logoUrl}
              onChange={handleChange}
              className="input-field"
              placeholder="https://ejemplo.com/mi-logo.png"
            />
            <p className="text-xs text-gray-400 mt-1">
              Sube tu logo a un servicio como imgur.com y pega la URL aquí. Deja vacío para usar el ícono predeterminado.
            </p>
            {settings.logoUrl && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg inline-block">
                <img src={settings.logoUrl} alt="Preview" className="h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color de marca
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="brandColor"
                  value={settings.brandColor || "#2563eb"}
                  onChange={handleChange}
                  className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  name="brandColor"
                  value={settings.brandColor || "#2563eb"}
                  onChange={handleChange}
                  className="input-field font-mono text-sm"
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umbral de stock bajo
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={settings.lowStockThreshold || 3}
                onChange={handleChange}
                className="input-field"
                min="1"
                placeholder="3"
              />
              <p className="text-xs text-gray-400 mt-1">
                Piezas con stock igual o menor se marcarán como "stock bajo"
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Plantillas de WhatsApp</h3>
        <p className="text-sm text-gray-500 mb-4">
          Personaliza los mensajes que se envían por WhatsApp. Variables disponibles: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{"\u007Bnombre\u007D"}</code> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{"\u007Bequipo\u007D"}</code> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{"\u007Borden\u007D"}</code>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje al crear orden
            </label>
            <textarea
              name="whatsappTemplateCreated"
              value={settings.whatsappTemplateCreated}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Hola {nombre}, su equipo {equipo} ha sido recibido..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje cuando está listo
            </label>
            <textarea
              name="whatsappTemplateReady"
              value={settings.whatsappTemplateReady}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Hola {nombre}, su equipo {equipo} está listo para recoger..."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Respaldo de Información
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Descarga un respaldo de todas las órdenes de servicio, configuración y partes del inventario.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/api/export?format=csv"
            download
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors font-medium text-sm"
          >
            <Download className="h-4 w-4" />
            Exportar Órdenes (Excel/CSV)
          </a>
          <a
            href="/api/export?format=json"
            download
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-medium text-sm"
          >
            <Download className="h-4 w-4" />
            Backup Completo (JSON)
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          El archivo CSV se abre directamente en Excel. El archivo JSON incluye toda la información del sistema (órdenes, configuración e inventario).
        </p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Cambiar Contraseña
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          {passwordError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">{passwordSuccess}</p>
          )}
          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {changingPassword ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {changingPassword ? "Cambiando..." : "Cambiar Contraseña"}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </div>
  );
}
