
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

type FilterType = "all" | "unread";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token || !apiUrl) {
      setError("Please log in to view your notifications.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const headers = { Authorization: `Bearer ${token}` };
      const [listResponse, countResponse] = await Promise.all([
        fetch(`${apiUrl}/notifications/`, { headers }),
        fetch(`${apiUrl}/notifications/unread-count`, { headers }),
      ]);

      if (!listResponse.ok || !countResponse.ok) {
        throw new Error("Unable to load notifications.");
      }

      const list: NotificationItem[] = await listResponse.json();
      const count = await countResponse.json();

      setNotifications(list);
      setUnreadCount(count.unread_count);
    } catch {
      setError("Could not load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem("access_token");
    if (!token || !apiUrl) return;

    setBusyId(id);
    try {
      const response = await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error();
      await loadNotifications();
    } catch {
      setError("Could not mark this notification as read.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !apiUrl) return;

    setBusyId(-1);
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
      setBusyId(null);
    }
  };

  const deleteNotification = async (id: number) => {
    const token = localStorage.getItem("access_token");
    if (!token || !apiUrl) return;

    setBusyId(id);
    try {
      const response = await fetch(`${apiUrl}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error();
      await loadNotifications();
    } catch {
      setError("Could not delete this notification.");
    } finally {
      setBusyId(null);
    }
  };

  const visibleNotifications = notifications.filter(
    (item) => filter === "all" || !item.is_read
  );

  const formatDate = (value: string) => {
    const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value}Z`;

    return new Date(normalized).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 font-semibold text-indigo-600">
              SOCIALPILOT
            </p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Stay updated on your posts, campaigns, and account activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total notifications</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
            <p className="text-sm text-indigo-700">Unread notifications</p>
            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {unreadCount}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "unread"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={unreadCount === 0 || busyId !== null}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark all as read
            </button>
          </div>

          {error && (
            <p role="alert" className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading notifications...
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl">🔔</div>
              <h2 className="mt-4 text-lg font-semibold text-slate-800">
                {filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {filter === "unread"
                  ? "You're all caught up."
                  : "Updates will appear here when they're generated."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleNotifications.map((item) => (
                <article
                  key={item.notification_id}
                  className={`p-4 transition sm:p-5 ${
                    item.is_read ? "bg-white" : "bg-indigo-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                      {item.notification_type.toLowerCase().includes("campaign")
                        ? "📢"
                        : item.notification_type.toLowerCase().includes("publish")
                        ? "📤"
                        : item.notification_type.toLowerCase().includes("account")
                        ? "👤"
                        : "🔔"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-900">
                          {item.title}
                        </h2>
                        {!item.is_read && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {item.message}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(item.created_at)}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
                        {item.link && (
                          <a
                            href={item.link}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            View details →
                          </a>
                        )}

                        {!item.is_read && (
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => void markAsRead(item.notification_id)}
                            className="text-slate-600 hover:text-indigo-600 disabled:opacity-40"
                          >
                            Mark as read
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => void deleteNotification(item.notification_id)}
                          className="text-red-600 hover:text-red-800 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
