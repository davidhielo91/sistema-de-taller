export type OrderStatus = 
  | "recibido" 
  | "diagnosticando" 
  | "reparando" 
  | "listo" 
  | "entregado";

export interface StatusHistoryEntry {
  from: OrderStatus;
  to: OrderStatus;
  date: string;
  note?: string;
}

export interface InternalNote {
  id: string;
  text: string;
  date: string;
}

export interface OrderUsedPart {
  partId: string;
  partName: string;
  quantity: number;
  unitCost: number;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  accessories: string;
  problemDescription: string;
  diagnosis: string;
  estimatedCost: number;
  partsCost: number;
  laborCost: number;
  estimatedDelivery: string;
  signature: string;
  devicePhotos: string[];
  usedParts: OrderUsedPart[];
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  internalNotes: InternalNote[];
  createdAt: string;
  updatedAt: string;
}

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  recibido: {
    label: "Recibido",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: "inbox",
  },
  diagnosticando: {
    label: "Diagnosticando",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: "search",
  },
  reparando: {
    label: "Reparando",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: "wrench",
  },
  listo: {
    label: "Listo para Entrega",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: "check-circle",
  },
  entregado: {
    label: "Entregado",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: "package-check",
  },
};

export const DEVICE_TYPES = [
  "Laptop",
  "PC de Escritorio",
  "Tablet",
  "Impresora",
  "Monitor",
  "Otro",
];

export const DEVICE_BRANDS = [
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "Acer",
  "Apple",
  "Samsung",
  "Toshiba",
  "MSI",
  "Otra",
];
