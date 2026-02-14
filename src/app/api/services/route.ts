import { NextRequest, NextResponse } from "next/server";
import { getServices, saveService, RepairService } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const services = getServices();
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener servicios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const service: RepairService = {
      id: uuidv4(),
      name: body.name || "",
      basePrice: body.basePrice || 0,
      linkedPartId: body.linkedPartId || undefined,
      linkedPartName: body.linkedPartName || undefined,
      linkedPartCost: body.linkedPartCost || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const saved = saveService(service);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 });
  }
}
