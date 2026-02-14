import { NextRequest, NextResponse } from "next/server";
import { getOrderById, saveOrder } from "@/lib/storage";
import { verifyClientToken } from "@/lib/client-token";

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
    const { action, clientNote } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updated = {
      ...order,
      budgetStatus: action === "approve" ? "approved" as const : "rejected" as const,
      budgetRespondedAt: now,
      clientNote: clientNote || undefined,
      updatedAt: now,
    };

    const saved = saveOrder(updated);
    return NextResponse.json({ success: true, budgetStatus: saved.budgetStatus });
  } catch {
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
