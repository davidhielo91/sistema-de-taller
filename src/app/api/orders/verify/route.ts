import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/storage";
import { generateClientToken } from "@/lib/client-token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, phone } = body;

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: "Número de orden y teléfono son requeridos" }, { status: 400 });
    }

    const order = getOrderByNumber(orderNumber.trim());
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verify phone matches (min 4 digits, suffix match)
    const cleanInput = phone.replace(/\D/g, "");
    const cleanStored = order.customerPhone.replace(/\D/g, "");
    if (cleanInput.length < 4) {
      return NextResponse.json({ error: "Ingresa al menos 4 dígitos del teléfono" }, { status: 400 });
    }
    if (!cleanStored.endsWith(cleanInput) && !cleanInput.endsWith(cleanStored) && cleanStored !== cleanInput) {
      return NextResponse.json({ error: "El teléfono no coincide con la orden" }, { status: 403 });
    }

    const token = generateClientToken(order.orderNumber, order.customerPhone);

    const res = NextResponse.json({ 
      success: true, 
      orderNumber: order.orderNumber,
    });
    
    // Set client token cookie (24h)
    res.cookies.set("str_client_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Error de verificación" }, { status: 500 });
  }
}
