"use client";

import { useEffect, useState } from "react";

type PostStatus =
  | "Scheduled"
  | "Pending"
  | "Failed"
  | "Published"
  | "Cancelled";

interface QueuePost {
  queue_id: number;
  post_id: number;
  platform: string;
  scheduled_time: string;
  status: string;
  priority: number;
  retry_count: number;
  content: string;
}

interface DraftPost {
  post_id: number;
  content: string;
  status: string;
  post_type: string;
}

export default function PublishingQueuePage() {
  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | PostStatus>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================== FETCH QUEUE ====================

  const fetchQueue = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/publishing-queue/",
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
          data.detail || "Failed to load publishing queue."
        );
      }

      setPosts(data);
    } catch (err) {
      console.error("Publishing queue error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load publishing queue."
      );
    } finally {
      setLoading(false);
    }
  };
  const fetchDrafts = async () => {
    const token = localStorage.getItem("access_token");
  
    if (!token) {
      window.location.href = "/";
      return;
    }
  
    try {
      setDraftsLoading(true);
  
      const response = await fetch(
        "http://127.0.0.1:8000/publishing-queue/drafts",
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
          data.detail || "Failed to load drafts."
        );
      }
  
      setDrafts(data);
    } catch (error) {
      console.error("Drafts error:", error);
    } finally {
      setDraftsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchDrafts();
  }, []);

  // ==================== STATUS ====================

  const getDisplayStatus = (
    status: string
  ): PostStatus => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "Scheduled";

      case "pending":
        return "Pending";

      case "failed":
        return "Failed";

        case "published":
          return "Published";
        
        case "cancelled":
          return "Cancelled";
        
        default:
          return "Pending";
    }
  };

  const getStatusStyle = (status: PostStatus) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-700";

      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      case "Failed":
        return "bg-red-100 text-red-700";

      case "Published":
        return "bg-green-100 text-green-700";
      
      case "Cancelled":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ==================== UPDATE STATUS ====================

  const updateQueueStatus = async (
    queueId: number,
    newStatus: string
  ) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/publishing-queue/${queueId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Failed to update queue status."
        );
        return;
      }

      await fetchQueue();

      alert("Queue status updated successfully.");
    } catch (error) {
      console.error(
        "Queue status update error:",
        error
      );

      alert(
        "Unable to connect to the backend server."
      );
    }
  };

  // ==================== ACTIONS ====================

  const handleRetry = async (queueId: number) => {
    await updateQueueStatus(
      queueId,
      "scheduled"
    );
  };

  const handleCancel = async (queueId: number) => {
    await updateQueueStatus(
      queueId,
      "cancelled"
    );
  };

  const handleView = (post: QueuePost) => {
    alert(
      `Post Details\n\n` +
        `Content: ${post.content}\n` +
        `Platform: ${post.platform}\n` +
        `Scheduled: ${formatDateTime(
          post.scheduled_time
        )}\n` +
        `Status: ${getDisplayStatus(
          post.status
        )}\n` +
        `Priority: ${post.priority}\n` +
        `Retry Count: ${post.retry_count}`
    );
  };

  // ==================== FORMAT DATE ====================

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  // ==================== FILTER ====================

  const filteredPosts =
    filter === "All"
      ? posts
      : posts.filter(
          (post) =>
            getDisplayStatus(post.status) ===
            filter
        );

  // ==================== COUNTS ====================

  const scheduledCount = posts.filter(
    (post) =>
      getDisplayStatus(post.status) ===
      "Scheduled"
  ).length;

  const pendingCount = posts.filter(
    (post) =>
      getDisplayStatus(post.status) ===
      "Pending"
  ).length;

  const failedCount = posts.filter(
    (post) =>
      getDisplayStatus(post.status) ===
      "Failed"
  ).length;

  const publishedCount = posts.filter(
    (post) =>
      getDisplayStatus(post.status) ===
      "Published"
  ).length;

  // ==================== UI ====================

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Publishing Queue
            </h1>

            <p className="mt-2 text-gray-600">
              Manage scheduled, pending, failed and published posts.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchQueue}
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>

            <a
              href="/create-post"
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              + Create Post
            </a>
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div className="mb-6 grid gap-4 md:grid-cols-4">

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Scheduled
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {scheduledCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Failed
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {failedCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Published
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {publishedCount}
            </p>
          </div>

        </div>
              {/* DRAFTS */}

      <section className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Drafts
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Saved posts that are not scheduled for publishing yet.
          </p>
        </div>

        {draftsLoading ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="font-medium text-gray-700">
              Loading drafts...
            </p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="font-medium text-gray-700">
              No drafts found.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Save a post as a draft to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.post_id}
                className="rounded-lg border border-gray-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-gray-900">
                      {draft.content}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>
                        Type:{" "}
                        <span className="font-medium text-gray-700">
                          {draft.post_type}
                        </span>
                      </span>

                      <span>
                        Post ID:{" "}
                        <span className="font-medium text-gray-700">
                          {draft.post_id}
                        </span>
                      </span>
                    </div>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    Draft
                  </span>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                <a
                    href={`/create-post?draft_id=${draft.post_id}`}
                    className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit / Schedule
                </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

        {/* QUEUE */}

        <section className="rounded-lg bg-white p-6 shadow">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Posts Queue
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View and manage your publishing activity.
              </p>
            </div>

            {/* FILTERS */}

            <div className="flex flex-wrap gap-2">

            {[
              "All",
              "Scheduled",
              "Pending",
              "Failed",
              "Published",
              "Cancelled",
            ].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setFilter(
                      status as
                        | "All"
                        | PostStatus
                    )
                  }
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    filter === status
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}

            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
              <p className="font-medium text-gray-700">
                Loading publishing queue...
              </p>
            </div>
          ) : error ? (
            /* ERROR */

            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-medium text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchQueue}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            /* EMPTY */

            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
              <p className="font-medium text-gray-700">
                No posts found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                There are no posts with this status.
              </p>

              <a
                href="/create-post"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create a Post
              </a>
            </div>
          ) : (
            /* POSTS */

            <div className="space-y-4">

              {filteredPosts.map((post) => {
                const displayStatus =
                  getDisplayStatus(
                    post.status
                  );

                return (
                  <div
                    key={post.queue_id}
                    className="rounded-lg border border-gray-200 p-5 transition hover:shadow-sm"
                  >

                    {/* TOP ROW */}

                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div className="min-w-0 flex-1">

                        <p className="text-base font-semibold text-gray-900">
                          {post.content}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">

                          <span>
                            Platform:{" "}
                            <span className="font-medium text-gray-700">
                              {post.platform}
                            </span>
                          </span>

                          <span>
                            Scheduled:{" "}
                            <span className="font-medium text-gray-700">
                              {formatDateTime(
                                post.scheduled_time
                              )}
                            </span>
                          </span>

                          <span>
                            Priority:{" "}
                            <span className="font-medium text-gray-700">
                              {post.priority}
                            </span>
                          </span>

                          <span>
                            Retries:{" "}
                            <span className="font-medium text-gray-700">
                              {post.retry_count}
                            </span>
                          </span>

                        </div>

                      </div>

                      {/* STATUS */}

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusStyle(
                          displayStatus
                        )}`}
                      >
                        {displayStatus}
                      </span>

                    </div>

                    {/* ACTIONS */}

                    <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-4">

                      <button
                        type="button"
                        onClick={() =>
                          handleView(post)
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </button>

                      {displayStatus ===
                        "Failed" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRetry(
                              post.queue_id
                            )
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Retry
                        </button>
                      )}

                      {displayStatus ===
                        "Scheduled" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCancel(
                              post.queue_id
                            )
                          }
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}