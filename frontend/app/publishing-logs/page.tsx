"use client";

import { useEffect, useState } from "react";

type LogStatus = "Published" | "Pending" | "Failed";

interface PublishingLog {
  log_id: number;
  post_id: number;
  queue_id: number | null;
  platform: string;
  status: string;
  published_at: string | null;
  error_message: string | null;
  retry_count: number;
  content: string;
}

export default function PublishingLogsPage() {
  const [logs, setLogs] = useState<PublishingLog[]>([]);
  const [statusFilter, setStatusFilter] =
    useState<"All" | LogStatus>("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================== FETCH LOGS ====================

  const fetchLogs = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/publishing-logs/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load publishing logs."
        );
      }

      setLogs(data);
    } catch (err) {
      console.error("Publishing logs error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load publishing logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ==================== STATUS ====================

  const getDisplayStatus = (
    status: string
  ): LogStatus => {
    switch (status.toLowerCase()) {
      case "published":
        return "Published";

      case "failed":
        return "Failed";

      default:
        return "Pending";
    }
  };

  const getStatusClass = (status: LogStatus) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-700";

      case "Failed":
        return "bg-red-100 text-red-700";

      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ==================== DATE ====================

  const formatDateTime = (
    dateString: string | null
  ) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  // ==================== FILTER ====================

  const filteredLogs =
    statusFilter === "All"
      ? logs
      : logs.filter(
          (log) =>
            getDisplayStatus(log.status) ===
            statusFilter
        );

  // ==================== COUNTS ====================

  const publishedCount = logs.filter(
    (log) =>
      getDisplayStatus(log.status) ===
      "Published"
  ).length;

  const pendingCount = logs.filter(
    (log) =>
      getDisplayStatus(log.status) ===
      "Pending"
  ).length;

  const failedCount = logs.filter(
    (log) =>
      getDisplayStatus(log.status) ===
      "Failed"
  ).length;

  // ==================== UI ====================

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Publishing Logs
            </h1>

            <p className="mt-2 text-gray-600">
              Track the publishing activity of your social media posts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={fetchLogs}
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>

            <a
              href="/publishing-queue"
              className="rounded-lg border border-gray-400 bg-white px-5 py-3 font-medium text-gray-900 hover:bg-gray-50"
            >
              Publishing Queue
            </a>

            <a
              href="/create-post"
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              + Create Post
            </a>

          </div>
        </div>

        {/* SUMMARY */}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Published
            </p>

            <p className="mt-1 text-3xl font-bold text-green-600">
              {publishedCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Pending
            </p>

            <p className="mt-1 text-3xl font-bold text-yellow-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Failed
            </p>

            <p className="mt-1 text-3xl font-bold text-red-600">
              {failedCount}
            </p>
          </div>

        </section>

        {/* FILTERS */}

        <section className="mb-6 rounded-lg bg-white p-5 shadow">

          <h2 className="mb-4 font-semibold text-gray-900">
            Filter Logs
          </h2>

          <div className="flex flex-wrap gap-3">

            {[
              "All",
              "Published",
              "Pending",
              "Failed",
            ].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    status as
                      | "All"
                      | LogStatus
                  )
                }
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  statusFilter === status
                    ? "border-blue-600 bg-blue-100 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}

          </div>
        </section>

        {/* LOGS */}

        <section className="overflow-hidden rounded-lg bg-white shadow">

          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Activity
            </h2>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                Loading publishing logs...
              </p>
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="font-medium text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchLogs}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                No publishing logs found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Publishing activity will appear here once posts are processed.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Post
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Platform
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Published Time
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Details
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-200">

                    {filteredLogs.map((log) => {

                      const displayStatus =
                        getDisplayStatus(
                          log.status
                        );

                      return (
                        <tr
                          key={log.log_id}
                          className="hover:bg-gray-50"
                        >

                          <td className="max-w-xs px-6 py-4">
                            <p className="line-clamp-2 text-sm text-gray-900">
                              {log.content}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {log.platform}
                          </td>

                          <td className="px-6 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                                displayStatus
                              )}`}
                            >
                              {displayStatus}
                            </span>

                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDateTime(
                              log.published_at
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm">

                            {log.error_message ? (
                              <span className="text-red-600">
                                {log.error_message}
                              </span>
                            ) : displayStatus ===
                              "Published" ? (
                              <span className="text-green-600">
                                Successfully published
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                Waiting to publish
                              </span>
                            )}

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

              {/* MOBILE */}

              <div className="space-y-4 p-4 md:hidden">

                {filteredLogs.map((log) => {

                  const displayStatus =
                    getDisplayStatus(
                      log.status
                    );

                  return (
                    <div
                      key={log.log_id}
                      className="rounded-lg border border-gray-200 p-4"
                    >

                      <div className="mb-3 flex items-center justify-between">

                        <span className="font-semibold text-gray-900">
                          {log.platform}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            displayStatus
                          )}`}
                        >
                          {displayStatus}
                        </span>

                      </div>

                      <p className="text-sm text-gray-800">
                        {log.content}
                      </p>

                      <div className="mt-3 space-y-1 text-sm text-gray-500">

                        <p>
                          Published:{" "}
                          {formatDateTime(
                            log.published_at
                          )}
                        </p>

                        <p>
                          Retry count:{" "}
                          {log.retry_count}
                        </p>

                        {log.error_message && (
                          <p className="text-red-600">
                            Error:{" "}
                            {log.error_message}
                          </p>
                        )}

                      </div>

                    </div>
                  );
                })}

              </div>
            </>
          )}

        </section>

      </div>
    </main>
  );
}