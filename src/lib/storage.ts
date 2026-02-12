import { ServiceOrder } from "@/types/order";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const PARTS_FILE = path.join(DATA_DIR, "parts.json");

export interface BusinessSettings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  logoUrl: string;
  brandColor: string;
  lowStockThreshold: number;
  schedule: string;
  whatsappTemplateCreated: string;
  whatsappTemplateReady: string;
}

export interface Part {
  id: string;
  name: string;
  cost: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsedPart {
  partId: string;
  partName: string;
  quantity: number;
  unitCost: number;
}


function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

export function getOrders(): ServiceOrder[] {
  ensureDataDir();
  const data = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

export function getOrderById(id: string): ServiceOrder | undefined {
  const orders = getOrders();
  return orders.find((o) => o.id === id);
}

export function getOrderByNumber(orderNumber: string): ServiceOrder | undefined {
  const orders = getOrders();
  return orders.find((o) => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
}

export function searchOrdersByPhone(phone: string): ServiceOrder[] {
  const orders = getOrders();
  const clean = phone.replace(/\D/g, "");
  return orders.filter((o) => o.customerPhone.replace(/\D/g, "").includes(clean));
}

export function getSettings(): BusinessSettings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaults: BusinessSettings = {
      businessName: "Mi Taller",
      phone: "",
      email: "",
      address: "",
      whatsapp: "",
      logoUrl: "",
      brandColor: "#2563eb",
      lowStockThreshold: 3,
      schedule: "Lun - Vie: 9:00 - 18:00\nSábado: 9:00 - 14:00",
      whatsappTemplateCreated: "Hola {nombre}, su equipo {equipo} ha sido recibido. Su número de orden es: {orden}. Le mantendremos informado sobre el progreso.",
      whatsappTemplateReady: "Hola {nombre}, su equipo {equipo} está listo para recoger. Orden: {orden}. ¡Gracias por su preferencia!",
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
}

export function saveSettings(settings: BusinessSettings): BusinessSettings {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return settings;
}

export function saveOrder(order: ServiceOrder): ServiceOrder {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.push(order);
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
  return order;
}

export function deleteOrder(id: string): boolean {
  const orders = getOrders();
  const filtered = orders.filter((o) => o.id !== id);
  if (filtered.length === orders.length) return false;
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export function generateOrderNumber(): string {
  const orders = getOrders();
  const now = new Date();
  const prefix = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const existing = orders.filter((o) => o.orderNumber.startsWith(prefix));
  const nextNum = existing.length + 1;
  return `${prefix}-${String(nextNum).padStart(4, "0")}`;
}

// ─── Parts Inventory ───

export function getParts(): Part[] {
  ensureDataDir();
  if (!fs.existsSync(PARTS_FILE)) {
    fs.writeFileSync(PARTS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(fs.readFileSync(PARTS_FILE, "utf-8"));
}

export function getPartById(id: string): Part | undefined {
  return getParts().find((p) => p.id === id);
}

export function savePart(part: Part): Part {
  const parts = getParts();
  const index = parts.findIndex((p) => p.id === part.id);
  if (index >= 0) {
    parts[index] = part;
  } else {
    parts.push(part);
  }
  fs.writeFileSync(PARTS_FILE, JSON.stringify(parts, null, 2));
  return part;
}

export function deletePart(id: string): boolean {
  const parts = getParts();
  const filtered = parts.filter((p) => p.id !== id);
  if (filtered.length === parts.length) return false;
  fs.writeFileSync(PARTS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export function reducePartStock(partId: string, quantity: number): Part | null {
  const parts = getParts();
  const index = parts.findIndex((p) => p.id === partId);
  if (index < 0) return null;
  parts[index].stock = Math.max(0, parts[index].stock - quantity);
  parts[index].updatedAt = new Date().toISOString();
  fs.writeFileSync(PARTS_FILE, JSON.stringify(parts, null, 2));
  return parts[index];
}

