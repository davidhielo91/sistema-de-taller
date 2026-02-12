import { NextRequest, NextResponse } from "next/server";
import { getOrders, saveOrder, generateOrderNumber } from "@/lib/storage";
import { ServiceOrder } from "@/types/order";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const orders = getOrders();
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const order: ServiceOrder = {
      id: uuidv4(),
      orderNumber: generateOrderNumber(),
      customerName: body.customerName || "",
      customerPhone: body.customerPhone || "",
      customerEmail: body.customerEmail || "",
      deviceType: body.deviceType || "",
      deviceBrand: body.deviceBrand || "",
      deviceModel: body.deviceModel || "",
      serialNumber: body.serialNumber || "",
      accessories: body.accessories || "",
      problemDescription: body.problemDescription || "",
      diagnosis: body.diagnosis || "",
      estimatedCost: body.estimatedCost || 0,
      partsCost: body.partsCost || 0,
      laborCost: body.laborCost || 0,
      estimatedDelivery: body.estimatedDelivery || "",
      signature: body.signature || "",
      devicePhotos: body.devicePhotos || [],
      usedParts: body.usedParts || [],
      status: "recibido",
      statusHistory: [],
      internalNotes: [],
      createdAt: now,
      updatedAt: now,
    };

    const saved = saveOrder(order);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear orden" }, { status: 500 });
  }
}
