import { NextRequest, NextResponse } from "next/server";
import { getParts, savePart, Part } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const parts = getParts();
    return NextResponse.json(parts);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener piezas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const part: Part = {
      id: uuidv4(),
      name: body.name || "",
      cost: body.cost || 0,
      stock: body.stock || 0,
      createdAt: now,
      updatedAt: now,
    };

    const saved = savePart(part);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear pieza" }, { status: 500 });
  }
}
