
"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationItem = {
  notification_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token || !apiUrl) return;

    try {
      const [listResponse, countResponse] = await Promise.all([
        fetch(`${apiUrl}/notifications/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!listResponse.ok || !countResponse.ok) {
        throw new Error("Unable to load notifications.");
      }

      const list = await listResponse.json();
      const count = await countResponse.json();

      setNotifications(list);
      setUnreadCount(count.unread_count);
      setError("");
    } catch {
      setError("Could not load notifications.");
    }
  }, [apiUrl]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem("access_token");
    if (!token || !apiUrl) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error();

      await loadNotifications();
    } catch {
      setError("Could not mark notification as read.");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !apiUrl) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error();

      await loadNotifications();
    } catch {
      setError("Could not mark notifications as read.");
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: number) => {
    const token = localStorage.getItem("access_token");
    if (!token || !apiUrl) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error();

      await loadNotifications();
    } catch {
      setError("Could not delete notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen) void loadNotifications();
        }}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-xl text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed right-4 top-[88px] z-[100] w-[min(320px,calc(100vw-32px))] max-h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              <p className="text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={loading || unreadCount === 0}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          {error && (
            <p role="alert" className="px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                You&apos;re all caught up!
              </p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.notification_id}
                  className={`border-b border-slate-100 p-4 ${
                    item.is_read ? "bg-white" : "bg-indigo-50/60"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!item.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
                        {!item.is_read && (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => void markAsRead(item.notification_id)}
                            className="text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                          >
                            Mark read
                          </button>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            onClick={() => setIsOpen(false)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            View
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void deleteNotification(item.notification_id)}
                          className="text-red-600 hover:text-red-800 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2 text-center">
            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="text-xs font-medium text-slate-500 hover:text-indigo-600"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}