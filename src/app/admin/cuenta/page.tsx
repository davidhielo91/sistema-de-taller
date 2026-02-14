"use client";

import { useState } from "react";
import { Lock, Database, Download, ShieldCheck } from "lucide-react";

export default function CuentaPage() {
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
      } else {
        setPasswordSuccess("Contraseña actualizada correctamente");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Error al cambiar la contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Seguridad y Cuenta
        </h2>
        <p className="text-gray-500 text-sm mt-1">Contraseña y respaldo de datos</p>
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
    </div>
  );
}
