import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppButton } from "./whatsapp-button";

export const metadata: Metadata = {
  title: "Sistema de Taller - Gestión de Órdenes de Servicio",
  description: "Sistema profesional de gestión de órdenes de servicio para talleres de reparación. Consulta el estado de tu orden en línea.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
