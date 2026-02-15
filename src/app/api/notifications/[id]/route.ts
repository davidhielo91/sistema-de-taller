import { NextRequest, NextResponse } from "next/server";
import { markAsRead, deleteNotification } from "@/lib/notifications";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminSession = cookieStore.get("str_admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const success = markAsRead(params.id);
    
    if (!success) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al marcar como leída" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminSession = cookieStore.get("str_admin_session");
    
    if (!adminSession) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const success = deleteNotification(params.id);
    
    if (!success) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar notificación" }, { status: 500 });
  }
}
