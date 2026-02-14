"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Wrench, PhoneCall, X } from "lucide-react";

export function WhatsAppButton() {
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.whatsapp) setWhatsapp(data.whatsapp);
        if (data?.phone) setPhone(data.phone);
        if (data?.businessName) setBusinessName(data.businessName);
      })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/admin")) return null;
  if (!whatsapp && !phone) return null;

  const waLink = (msg: string) =>
    `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-200" style={{ animation: "slideUp .25s ease-out" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">¿Necesitas ayuda?</p>
                <p className="text-xs text-green-100">Estamos aquí para ti</p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="divide-y divide-gray-100">
            {whatsapp && (
              <a
                href={waLink(`Hola${businessName ? ` ${businessName}` : ""}, necesito soporte técnico.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="bg-green-100 text-green-600 rounded-full p-2.5 shrink-0">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Soporte Técnico</p>
                  <p className="text-xs text-gray-500">Escríbenos por WhatsApp</p>
                </div>
              </a>
            )}

            {phone && (
              <a
                href={`tel:+${phone.replace(/\D/g, "")}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="bg-purple-100 text-purple-600 rounded-full p-2.5 shrink-0">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Llamar</p>
                  <p className="text-xs text-gray-500">Contáctanos directo</p>
                </div>
              </a>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
              Respuesta en menos de 5 minutos
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
            </p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
          open
            ? "bg-gray-700 hover:bg-gray-800 text-white"
            : "bg-green-500 hover:bg-green-600 text-white"
        }`}
        aria-label={open ? "Cerrar menú" : "Contactar"}
      >
        {open ? (
          <X className="h-7 w-7" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
