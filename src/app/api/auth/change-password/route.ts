import { NextRequest, NextResponse } from "next/server";
import { verifyStoredPassword, savePassword } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Se requiere la contraseña actual y la nueva" },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 4 caracteres" },
        { status: 400 }
      );
    }

    if (!verifyStoredPassword(currentPassword)) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 403 }
      );
    }

    savePassword(newPassword);

    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch {
    return NextResponse.json(
      { error: "Error al cambiar la contraseña" },
      { status: 500 }
    );
  }
}
