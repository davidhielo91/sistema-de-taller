import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/storage";
import { verifyClientToken } from "@/lib/client-token";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const token = request.cookies.get("str_client_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const verified = verifyClientToken(token);
    if (!verified) {
      return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
    }

    if (verified.orderNumber.toLowerCase() !== params.orderNumber.toLowerCase()) {
      return NextResponse.json({ error: "No autorizado para esta orden" }, { status: 403 });
    }

    const order = getOrderByNumber(params.orderNumber);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Return only client-safe data (no internal notes, no signature, no cost breakdowns)
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      deviceType: order.deviceType,
      deviceBrand: order.deviceBrand,
      deviceModel: order.deviceModel || "",
      accessories: order.accessories || "",
      problemDescription: order.problemDescription,
      diagnosis: order.diagnosis || "",
      estimatedCost: order.estimatedCost || 0,
      estimatedDelivery: order.estimatedDelivery || "",
      status: order.status,
      statusHistory: (order.statusHistory || []).map((h) => ({
        from: h.from,
        to: h.to,
        date: h.date,
      })),
      devicePhotos: order.devicePhotos || [],
      selectedServices: (order.selectedServices || []).map((s) => ({
        name: s.name,
        basePrice: s.basePrice,
      })),
      budgetStatus: order.budgetStatus || "none",
      budgetSentAt: order.budgetSentAt,
      budgetRespondedAt: order.budgetRespondedAt,
      budgetNote: order.budgetNote,
      clientNote: order.clientNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
