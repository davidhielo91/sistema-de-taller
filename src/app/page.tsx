"use client";

import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/currencies";
import { STATUS_CONFIG, OrderStatus } from "@/types/order";
import {
  Monitor,
  Search,
  Wrench,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  Laptop,
  Shield,
  Zap,
  Hash,
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
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"order" | "phone">("order");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

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

  const currentStepIndex = order
    ? STATUS_STEPS.indexOf(order.status)
    : -1;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="bg-primary-600 p-2 rounded-lg">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {settings?.businessName || "Mi Taller"}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Servicio Técnico Profesional
                </p>
              </div>
            </div>
            {settings?.phone && (
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1 font-medium"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">{settings.phone}</span>
                <span className="sm:hidden">Llamar</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              Reparación Profesional de{" "}
              <span className="text-primary-200">Computadoras y Laptops</span>
            </h2>
            <p className="text-lg sm:text-xl text-primary-100 mb-10">
              Diagnóstico preciso, reparación garantizada. Consulta el estado de
              tu equipo en cualquier momento.
            </p>

            {/* Search Box */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto">
              <h3 className="text-gray-900 font-semibold text-lg mb-4 flex items-center justify-center gap-2">
                <Search className="h-5 w-5 text-primary-600" />
                Consulta tu Orden
              </h3>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => { setSearchType("order"); setOrder(null); setOrders([]); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchType === "order" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500"
                  }`}
                >
                  <Hash className="h-3.5 w-3.5" />
                  N° de Orden
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchType("phone"); setOrder(null); setOrders([]); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchType === "phone" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Teléfono
                </button>
              </div>
              <form onSubmit={handleSearch} className="space-y-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchType === "order" ? "Ej: ORD-202602-0001" : "Ej: (123) 456-7890"}
                  className="input-field text-center"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
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
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Order Result */}
      {order && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-12">
          <div className="card shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500">Orden</p>
                <p className="text-xl font-bold text-gray-900">
                  {order.orderNumber}
                </p>
              </div>
              <span
                className={`status-badge ${STATUS_CONFIG[order.status].bgColor} ${STATUS_CONFIG[order.status].color}`}
              >
                {STATUS_CONFIG[order.status].label}
              </span>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                          isCompleted
                            ? "bg-primary-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        } ${isCurrent ? "ring-4 ring-primary-200" : ""}`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 text-center ${
                          isCompleted
                            ? "text-primary-600 font-medium"
                            : "text-gray-400"
                        }`}
                      >
                        {STATUS_CONFIG[step].label}
                      </p>
                      {index < STATUS_STEPS.length - 1 && (
                        <div
                          className={`absolute top-5 left-[55%] w-[90%] h-0.5 ${
                            index < currentStepIndex
                              ? "bg-primary-600"
                              : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Equipo</p>
                  <p className="font-medium">
                    {order.deviceBrand} {order.deviceModel ? order.deviceModel : ""} - {order.deviceType}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Problema</p>
                  <p className="font-medium">{order.problemDescription}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500">Diagnóstico</p>
                  <p className="font-medium">
                    {order.diagnosis || "Pendiente"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Costo Estimado</p>
                  <p className="font-medium text-lg">
                    {order.estimatedCost > 0
                      ? formatMoney(order.estimatedCost, settings?.currency || "MXN")
                      : "Por determinar"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Fecha de Ingreso</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Phone Search Results (multiple orders) */}
      {orders.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-12">
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">
              {orders.length} orden{orders.length !== 1 ? "es" : ""} encontrada{orders.length !== 1 ? "s" : ""}
            </p>
            {orders.map((o) => (
              <div key={o.orderNumber} className="card shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Orden</p>
                    <p className="text-lg font-bold text-gray-900">{o.orderNumber}</p>
                  </div>
                  <span className={`status-badge ${STATUS_CONFIG[o.status].bgColor} ${STATUS_CONFIG[o.status].color}`}>
                    {STATUS_CONFIG[o.status].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Equipo</p>
                    <p className="font-medium">{o.deviceBrand} - {o.deviceType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Costo Estimado</p>
                    <p className="font-medium">
                      {o.estimatedCost > 0 ? formatMoney(o.estimatedCost, settings?.currency || "MXN") : "Por determinar"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Problema</p>
                    <p className="font-medium">{o.problemDescription}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha</p>
                    <p className="font-medium">
                      {new Date(o.createdAt).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl font-bold text-center mb-12 text-gray-900">
          Nuestros Servicios
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Laptop,
              title: "Reparación de Laptops",
              desc: "Pantallas, teclados, baterías, placas madre y más.",
            },
            {
              icon: Monitor,
              title: "PCs de Escritorio",
              desc: "Ensamblaje, actualización y reparación de componentes.",
            },
            {
              icon: Zap,
              title: "Optimización",
              desc: "Limpieza de software, formato y mejora de rendimiento.",
            },
            {
              icon: Shield,
              title: "Eliminación de Virus",
              desc: "Detección y limpieza de malware, ransomware y virus.",
            },
            {
              icon: Wrench,
              title: "Mantenimiento",
              desc: "Limpieza preventiva, pasta térmica y mantenimiento general.",
            },
            {
              icon: Clock,
              title: "Servicio Rápido",
              desc: "Diagnóstico en 24h. Reparaciones urgentes disponibles.",
            },
          ].map((service, i) => (
            <div
              key={i}
              className="card hover:shadow-md transition-shadow group"
            >
              <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                <service.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {service.title}
              </h4>
              <p className="text-sm text-gray-600">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Contáctanos</h3>
          <p className="text-gray-500 text-sm text-center mb-10">Estamos para ayudarte con tu equipo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary-100 text-center hover:shadow-md transition-shadow">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-5 w-5 text-primary-600" />
              </div>
              <p className="font-semibold text-gray-800 text-sm mb-1">Teléfono</p>
              {settings?.phone ? (
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="text-primary-600 hover:text-primary-700 transition-colors text-sm font-medium">
                  {settings.phone}
                </a>
              ) : (
                <span className="text-gray-400 italic text-sm">Sin configurar</span>
              )}
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary-100 text-center hover:shadow-md transition-shadow">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-5 w-5 text-primary-600" />
              </div>
              <p className="font-semibold text-gray-800 text-sm mb-1">Email</p>
              {settings?.email ? (
                <a href={`mailto:${settings.email}`} className="text-primary-600 hover:text-primary-700 transition-colors text-sm font-medium break-all">
                  {settings.email}
                </a>
              ) : (
                <span className="text-gray-400 italic text-sm">Sin configurar</span>
              )}
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary-100 text-center hover:shadow-md transition-shadow">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <p className="font-semibold text-gray-800 text-sm mb-1">Dirección</p>
              <p className="text-gray-500 text-sm">
                {settings?.address || <span className="italic text-gray-400">Sin configurar</span>}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-primary-100 text-center hover:shadow-md transition-shadow">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              <p className="font-semibold text-gray-800 text-sm mb-1">Horario</p>
              {(settings?.schedule || "Lun - Vie: 9:00 - 18:00\nSábado: 9:00 - 14:00").split("\n").map((line, i) => (
                <p key={i} className="text-gray-500 text-sm">{line}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} {settings?.businessName || "Mi Taller"}. Todos los
            derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
