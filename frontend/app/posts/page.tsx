
"use client";

import { useCallback, useEffect, useState } from "react";

interface PostMetrics {
  likes: number | null;
  comments: number | null;
  shares: number | null;
  reach: number | null;
  saved: number | null;
  error: string | null;
}

interface PublishedPost {
  log_id: number;
  post_id: number;
  platform: string;
  username: string | null;
  content: string;
  media_url: string | null;
  external_post_id: string;
  published_at: string | null;
  metrics: PostMetrics;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPosts = useCallback(async (background = false) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/published-posts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load published posts and metrics."
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected response.");
      }

      setPosts(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Published posts metrics error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load published posts and metrics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchPosts(true);
      }
    }, 60_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchPosts(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPosts]);

  const formatDateTime = (value: string | null) => {
    if (!value) return "Time unavailable";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  };

  const formatMetric = (value: number | null | undefined) =>
    value === null || value === undefined
      ? "—"
      : value.toLocaleString();

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-gray-900 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Published Posts</h1>
            <p className="mt-2 text-gray-600">
              Real published posts and the latest engagement data from
              connected social platforms.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {lastUpdated
                ? `Metrics last checked at ${lastUpdated}`
                : "Metrics have not been refreshed yet"}
              {" · "}
              Automatic refresh every 60 seconds while this page is open
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchPosts(true)}
            disabled={loading || refreshing}
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Verified published posts</p>
          <p className="mt-1 text-3xl font-bold text-indigo-600">
            {posts.length}
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            Loading published posts and live metrics...
          </div>
        ) : error && posts.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void fetchPosts()}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No verified published posts yet
            </h2>
            <p className="mt-2 text-gray-600">
              Posts appear here after successful publishing and saving the
              external post ID returned by the platform.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Refresh failed: {error}
              </p>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.log_id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {post.media_url ? (
                    <img
                      src={post.media_url}
                      alt="Published post media"
                      className="h-56 w-full bg-gray-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gray-50 p-6 text-gray-400">
                      Text post
                    </div>
                  )}

                  <div className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                        {post.platform}
                      </span>
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        Published
                      </span>
                    </div>

                    <div>
                      <h2 className="mb-2 font-semibold">Caption</h2>
                      <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                        {post.content || "No caption"}
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-3 font-semibold">Live engagement</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Likes", value: post.metrics.likes },
                          { label: "Comments", value: post.metrics.comments },
                          { label: "Shares", value: post.metrics.shares },
                          { label: "Reach", value: post.metrics.reach },
                          { label: "Saves", value: post.metrics.saved },
                        ].map((metric) => (
                          <div
                            key={metric.label}
                            className="rounded-lg bg-gray-50 p-3"
                          >
                            <p className="text-xs text-gray-500">
                              {metric.label}
                            </p>
                            <p className="mt-1 text-xl font-semibold">
                              {formatMetric(metric.value)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {post.metrics.error && (
                        <p className="mt-3 text-xs text-amber-700">
                          Some metrics are unavailable:
                          {" "}
                          {post.metrics.error}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 border-t border-gray-100 pt-3 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Published:</span>{" "}
                        {formatDateTime(post.published_at)}
                      </p>
                      <p>
                        <span className="font-medium">Account:</span>{" "}
                        {post.username || "Connected account"}
                      </p>
                      <p className="break-all">
                        <span className="font-medium">Post ID:</span>{" "}
                        {post.external_post_id}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
