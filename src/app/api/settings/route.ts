import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/storage";

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const saved = saveSettings(body);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
