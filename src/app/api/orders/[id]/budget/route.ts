import { NextRequest, NextResponse } from "next/server";
import { getOrderById, saveOrder } from "@/lib/storage";
import { verifyClientToken } from "@/lib/client-token";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const order = getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verify the token matches this order
    if (order.orderNumber.toLowerCase() !== verified.orderNumber.toLowerCase()) {
      return NextResponse.json({ error: "No autorizado para esta orden" }, { status: 403 });
    }

    if (order.budgetStatus !== "pending") {
      return NextResponse.json({ error: "No hay presupuesto pendiente de aprobación" }, { status: 400 });
    }

    const body = await request.json();
    const { action, clientNote, approvalSignature } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    if (action === "approve" && !approvalSignature) {
      return NextResponse.json({ error: "Se requiere firma para aprobar el presupuesto" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updated = {
      ...order,
      budgetStatus: action === "approve" ? "approved" as const : "rejected" as const,
      budgetRespondedAt: now,
      clientNote: clientNote || undefined,
      approvalSignature: action === "approve" ? approvalSignature : undefined,
      updatedAt: now,
    };

    const saved = saveOrder(updated);
    
    // Create notification
    if (action === "approve") {
      createNotification(
        "budget_approved",
        "Presupuesto Aprobado",
        `El cliente aprobó el presupuesto de la orden ${order.orderNumber}`,
        order.id,
        order.orderNumber
      );
    } else {
      createNotification(
        "budget_rejected",
        "Presupuesto Rechazado",
        `El cliente rechazó el presupuesto de la orden ${order.orderNumber}`,
        order.id,
        order.orderNumber
      );
    }
    
    return NextResponse.json({ success: true, budgetStatus: saved.budgetStatus });
  } catch {
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
