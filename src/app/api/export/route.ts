import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/storage";
import { STATUS_CONFIG } from "@/types/order";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") || "csv";

  if (format === "json") {
    // Full backup: orders + settings + parts
    const dataDir = path.join(process.cwd(), "data");
    const backup: Record<string, unknown> = {};

    const files = ["orders.json", "settings.json", "parts.json", "services.json"];
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      try {
        if (fs.existsSync(filePath)) {
          backup[file.replace(".json", "")] = JSON.parse(
            fs.readFileSync(filePath, "utf-8")
          );
        }
      } catch {
        // skip corrupted files
      }
    }

    backup.exportDate = new Date().toISOString();
    backup.version = "1.0";

    const json = JSON.stringify(backup, null, 2);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  // CSV export
  const orders = getOrders();

  const headers = [
    "Número de Orden",
    "Fecha de Creación",
    "Estado",
    "Cliente",
    "Teléfono",
    "Email",
    "Tipo de Equipo",
    "Marca",
    "Modelo",
    "Número de Serie",
    "Accesorios",
    "Problema",
    "Diagnóstico",
    "Costo Estimado",
    "Costo Repuestos",
    "Entrega Estimada",
    "Notas Internas",
    "Última Actualización",
  ];

  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toLocaleDateString("es-MX"),
    STATUS_CONFIG[o.status]?.label || o.status,
    o.customerName,
    o.customerPhone,
    o.customerEmail || "",
    o.deviceType,
    o.deviceBrand,
    o.deviceModel || "",
    o.serialNumber || "",
    o.accessories || "",
    o.problemDescription,
    o.diagnosis || "",
    o.estimatedCost || 0,
    o.partsCost || 0,
    o.estimatedDelivery || "",
    Array.isArray(o.internalNotes) ? o.internalNotes.map((n) => n.text).join(" | ") : "",
    new Date(o.updatedAt).toLocaleDateString("es-MX"),
  ]);

  const BOM = "\uFEFF";
  const csv =
    BOM +
    headers.map(escapeCSV).join(",") +
    "\n" +
    rows.map((row) => row.map(escapeCSV).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ordenes_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
