import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(process.cwd(), "data");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");

export interface Notification {
  id: string;
  type: "budget_approved" | "budget_rejected" | "order_created" | "order_completed";
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  read: boolean;
  createdAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
  }
}

export function getNotifications(): Notification[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function createNotification(
  type: Notification["type"],
  title: string,
  message: string,
  orderId: string,
  orderNumber: string
): Notification {
  ensureDataDir();
  const notifications = getNotifications();
  
  const notification: Notification = {
    id: uuidv4(),
    type,
    title,
    message,
    orderId,
    orderNumber,
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(notification); // Add to beginning
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  
  return notification;
}

export function markAsRead(notificationId: string): boolean {
  ensureDataDir();
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === notificationId);
  
  if (index === -1) return false;
  
  notifications[index].read = true;
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  
  return true;
}

export function markAllAsRead(): boolean {
  ensureDataDir();
  const notifications = getNotifications();
  
  notifications.forEach((n) => {
    n.read = true;
  });
  
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  
  return true;
}

export function deleteNotification(notificationId: string): boolean {
  ensureDataDir();
  const notifications = getNotifications();
  const filtered = notifications.filter((n) => n.id !== notificationId);
  
  if (filtered.length === notifications.length) return false;
  
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(filtered, null, 2));
  
  return true;
}

export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter((n) => !n.read).length;
}
