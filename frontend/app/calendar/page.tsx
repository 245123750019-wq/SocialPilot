"use client";

import { useEffect, useState } from "react";

type Post = {
  id: number;
  date: string;
  time: string;
  content: string;
  platforms: string[];
  status: string;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(
    new Date(2026, 8, 1)
  );

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==================== FETCH SCHEDULED POSTS ====================

  useEffect(() => {
    const fetchScheduledPosts = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/scheduled-posts/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.detail ||
              "Failed to load scheduled posts."
          );
          return;
        }

        setPosts(data);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to connect to the backend server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledPosts();
  }, []);

  // ==================== CALENDAR DATA ====================

  const year = currentDate.getFullYear();

  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString(
    "default",
    {
      month: "long",
    }
  );

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  // ==================== MONTH NAVIGATION ====================

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    );

    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    );

    setSelectedDate(null);
  };

  // ==================== DATE POSTS ====================

  const getPostsForDate = (day: number) => {
    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}` +
      `-${String(day).padStart(2, "0")}`;

    return posts.filter(
      (post) => post.date === dateString
    );
  };

  const selectedPosts = selectedDate
    ? posts.filter(
        (post) => post.date === selectedDate
      )
    : [];

  // ==================== STATUS STYLE ====================

  const getStatusStyle = (status: string) => {
    const normalizedStatus =
      status.toLowerCase();

    if (normalizedStatus === "published") {
      return "bg-green-100 text-green-700";
    }

    if (normalizedStatus === "failed") {
      return "bg-red-100 text-red-700";
    }

    if (normalizedStatus === "pending") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  return (
    <main className="min-h-screen bg-gray-100 p-3 sm:p-5 lg:p-8 text-gray-900 overflow-x-hidden">

      <div className="mx-auto max-w-6xl">

        {/* ==================== HEADER ==================== */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Publishing Calendar
            </h1>

            <p className="mt-2 text-gray-600">
              View and manage your scheduled social media posts.
            </p>

          </div>

          <a
            href="/create-post"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            + Create Post
          </a>

        </div>

        {/* ==================== ERROR ==================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ==================== LOADING ==================== */}

        {loading ? (

          <section className="rounded-lg bg-white p-10 text-center shadow">

            <p className="text-gray-600">
              Loading scheduled posts...
            </p>

          </section>

        ) : (

          /* ==================== CALENDAR ==================== */

          <section className="rounded-lg bg-white p-2 sm:p-4 lg:p-6 shadow overflow-hidden">

            {/* Calendar Header */}

            <div className="mb-4 flex items-center justify-between gap-2">

              <button
                type="button"
                onClick={goToPreviousMonth}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 sm:px-4"
              >
                ←
              </button>

              <h2 className="min-w-0 text-center text-lg font-semibold text-gray-900 sm:text-2xl">
                {monthName} {year}
              </h2>

              <button
                type="button"
                onClick={goToNextMonth}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 sm:px-4"
              >
                →
              </button>

            </div>

            {/* ==================== WEEKDAYS ==================== */}

            <div className="grid grid-cols-7 border-b border-gray-200">

              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (

                <div
                  key={day}
                  className="px-0 py-2 text-center text-[10px] font-semibold text-gray-700 sm:p-3 sm:text-sm"
                >
                  {day}
                </div>

              ))}

            </div>

            {/* ==================== CALENDAR DAYS ==================== */}

            <div className="grid grid-cols-7">

              {/* Empty cells */}

              {Array.from({
                length: firstDay,
              }).map((_, index) => (

                <div
                  key={`empty-${index}`}
                  className="min-h-16 border-b border-r border-gray-200 bg-gray-50 sm:min-h-24 lg:min-h-32"
                />

              ))}

              {/* Days */}

              {Array.from({
                length: daysInMonth,
              }).map((_, index) => {

                const day = index + 1;

                const dateString =
                  `${year}-${String(
                    month + 1
                  ).padStart(2, "0")}` +
                  `-${String(day).padStart(
                    2,
                    "0"
                  )}`;

                const dayPosts =
                  getPostsForDate(day);

                const isSelected =
                  selectedDate === dateString;

                return (

                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setSelectedDate(
                        dateString
                      )
                    }
                    className={`min-h-16 border-b border-r border-gray-200 p-1 text-left align-top transition sm:min-h-24 sm:p-2 lg:min-h-32 ${
                      isSelected
                        ? "bg-blue-50"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >

                    {/* Day Number */}

                    <div
                      className={`mb-2 font-semibold ${
                        isSelected
                          ? "text-blue-700"
                          : "text-gray-900"
                      }`}
                    >
                      {day}
                    </div>

                    {/* Posts */}

                    <div className="space-y-1">

                      {dayPosts.map((post) => (

                        <div
                          key={post.id}
                          className="rounded bg-blue-100 p-1 text-[9px] leading-tight text-blue-800 sm:p-2 sm:text-xs"
                        >

                          <p className="font-semibold truncate">
                            {post.time}
                          </p>

                          <p className="mt-1 line-clamp-2 break-words">
                            {post.content}
                          </p>

                          <p className="mt-1">
                            {post.platforms
                              .map((platform) =>
                                platform ===
                                "Twitter-X"
                                  ? "X"
                                  : platform
                              )
                              .join(", ")}
                          </p>

                        </div>

                      ))}

                    </div>

                  </button>

                );
              })}

            </div>

            {/* ==================== EMPTY DATABASE ==================== */}

            {posts.length === 0 && (

              <div className="mt-6 rounded-lg bg-gray-50 p-5 text-center">

                <p className="text-gray-500">
                  No scheduled posts found.
                </p>

                <a
                  href="/create-post"
                  className="mt-3 inline-block text-blue-600 hover:text-blue-800"
                >
                  Create your first scheduled post
                </a>

              </div>

            )}

          </section>

        )}

        {/* ==================== SELECTED DAY ==================== */}

        {selectedDate && (

          <section className="mt-6 rounded-lg bg-white p-6 shadow">

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-xl font-semibold text-gray-900">
                Posts for {selectedDate}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedDate(null)
                }
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Close
              </button>

            </div>

            {selectedPosts.length === 0 ? (

              <p className="text-gray-500">
                No posts scheduled for this day.
              </p>

            ) : (

              <div className="space-y-4">

                {selectedPosts.map((post) => (

                  <div
                    key={post.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <p className="font-semibold text-gray-900">
                        {post.time}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-sm ${getStatusStyle(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>

                    </div>

                    <p className="mt-3 text-gray-900">
                      {post.content}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Platforms:{" "}
                      {post.platforms
                        .map((platform) =>
                          platform === "Twitter-X"
                            ? "X"
                            : platform
                        )
                        .join(", ")}
                    </p>

                  </div>

                ))}

              </div>

            )}

          </section>

        )}

      </div>

    </main>
  );
}78  