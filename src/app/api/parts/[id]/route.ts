import { NextRequest, NextResponse } from "next/server";
import { getPartById, savePart, deletePart } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const part = getPartById(params.id);
    if (!part) {
      return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 });
    }
    return NextResponse.json(part);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener pieza" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const part = getPartById(params.id);
    if (!part) {
      return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const updated = {
      ...part,
      ...body,
      id: part.id,
      createdAt: part.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const saved = savePart(updated);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar pieza" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = deletePart(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ message: "Pieza eliminada" });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar pieza" }, { status: 500 });
  }
}
