import { NextRequest, NextResponse } from "next/server";
import { getOrderById, saveOrder, deleteOrder, reducePartStock } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener orden" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const now = new Date().toISOString();

    // Track status changes in history
    let statusHistory = order.statusHistory || [];
    if (body.status && body.status !== order.status) {
      statusHistory = [
        ...statusHistory,
        {
          from: order.status,
          to: body.status,
          date: now,
          note: body.statusChangeNote || undefined,
        },
      ];
    }

    // Auto-reduce stock for newly added parts
    const oldParts = order.usedParts || [];
    const newParts = body.usedParts || oldParts;
    for (const np of newParts) {
      const op = oldParts.find((p: { partId: string }) => p.partId === np.partId);
      const oldQty = op ? op.quantity : 0;
      const diff = np.quantity - oldQty;
      if (diff > 0) {
        reducePartStock(np.partId, diff);
      }
    }

    const updated = {
      ...order,
      ...body,
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      statusHistory,
      internalNotes: body.internalNotes || order.internalNotes || [],
      usedParts: newParts,
      devicePhotos: body.devicePhotos || order.devicePhotos || [],
      updatedAt: now,
    };

    const saved = saveOrder(updated);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = deleteOrder(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ message: "Orden eliminada" });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar orden" }, { status: 500 });
  }
}
