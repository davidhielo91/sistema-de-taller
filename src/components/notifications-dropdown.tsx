"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "budget_approved" | "budget_rejected" | "order_created" | "order_completed";
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; openLeft: boolean }>({ top: 0, left: 0, openLeft: false });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleDropdown = useCallback(() => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const isMobile = vw < 640;
      if (isMobile) {
        setDropdownPos({ top: rect.bottom + 8, left: 0, openLeft: false });
      } else {
        const openLeft = rect.left > 400;
        setDropdownPos({
          top: rect.bottom + 8,
          left: openLeft ? rect.right : rect.left,
          openLeft,
        });
      }
    }
    setIsOpen(!isOpen);
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      console.error("Error fetching notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch {
      console.error("Error marking as read");
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch {
      console.error("Error marking all as read");
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch {
      console.error("Error deleting notification");
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "budget_approved":
        return "bg-green-100 text-green-700";
      case "budget_rejected":
        return "bg-red-100 text-red-700";
      case "order_created":
        return "bg-blue-100 text-blue-700";
      case "order_completed":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-[70] max-h-[500px] overflow-hidden flex flex-col"
            style={{
              top: dropdownPos.top,
              ...(window.innerWidth < 640
                ? { left: 12, right: 12 }
                : {
                    width: 384,
                    ...(dropdownPos.openLeft
                      ? { right: window.innerWidth - dropdownPos.left }
                      : { left: Math.min(dropdownPos.left, window.innerWidth - 396) }),
                  }),
            }}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`shrink-0 w-2 h-2 rounded-full mt-2 ${
                            !notification.read ? "bg-blue-500" : "bg-transparent"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/admin/ordenes/${notification.orderId}`}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                              setIsOpen(false);
                            }}
                            className="block"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              <span
                                className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${getNotificationColor(
                                  notification.type
                                )}`}
                              >
                                {notification.orderNumber}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {formatDate(notification.createdAt)}
                            </p>
                          </Link>
                        </div>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
