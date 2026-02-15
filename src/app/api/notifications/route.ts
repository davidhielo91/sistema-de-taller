import { NextRequest, NextResponse } from "next/server";
import { getNotifications, markAllAsRead } from "@/lib/notifications";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const adminSession = cookieStore.get("str_admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const notifications = getNotifications();
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const adminSession = cookieStore.get("str_admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "mark_all_read") {
      markAllAsRead();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
