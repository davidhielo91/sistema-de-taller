import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber, searchOrdersByPhone } from "@/lib/storage";
import { ServiceOrder } from "@/types/order";

function publicOrderData(order: ServiceOrder) {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    deviceType: order.deviceType,
    deviceBrand: order.deviceBrand,
    deviceModel: order.deviceModel || "",
    accessories: order.accessories || "",
    problemDescription: order.problemDescription,
    diagnosis: order.diagnosis,
    estimatedCost: order.estimatedCost,
    estimatedDelivery: order.estimatedDelivery || "",
    status: order.status,
    budgetStatus: order.budgetStatus || "none",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "order"; // "order" or "phone"

    if (!query) {
      return NextResponse.json({ error: "Búsqueda requerida" }, { status: 400 });
    }

    if (type === "phone") {
      const orders = searchOrdersByPhone(query);
      if (orders.length === 0) {
        return NextResponse.json({ error: "No se encontraron órdenes con ese teléfono" }, { status: 404 });
      }
      return NextResponse.json(orders.map(publicOrderData));
    }

    // Default: search by order number
    const order = getOrderByNumber(query);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json(publicOrderData(order));
  } catch (error) {
    return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
  }
}
