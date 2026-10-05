"use client";

import { useEffect, useState } from "react";

type ContentType =
  | "Text"
  | "Image"
  | "Video"
  | "Carousel"
  | "Story"
  | "Reel";

  type Platform =
  | "Instagram"
  | "Facebook"
  | "X"
  | "LinkedIn"
  | "YouTube";
interface Campaign {
  campaign_id: number;
  campaign_name: string;
  status: string | null;
}

export default function CreatePostPage() {
  // ==================== CONTENT ====================

  const [contentType, setContentType] =
    useState<ContentType>("Text");

  const [content, setContent] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  // ==================== PLATFORMS ====================

  const [platforms, setPlatforms] = useState<Platform[]>([
    "Instagram",
  ]);

  // ==================== SCHEDULE ====================

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [scheduleType, setScheduleType] = useState<
    "once" | "recurring"
  >("once");

  const [recurringFrequency, setRecurringFrequency] =
    useState<"daily" | "weekly" | "monthly">("daily");

  const [endDate, setEndDate] = useState("");

  // ==================== UI ====================

  const [showPreview, setShowPreview] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // ==================== CAMPAIGNS ====================

  useEffect(() => {
    const fetchCampaigns = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/campaigns/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setCampaigns(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Campaigns error:", error);
      }
    };

    fetchCampaigns();
  }, []);

  // ==================== PLATFORM TOGGLE ====================

  const togglePlatform = (platform: Platform) => {
    setPlatforms((current) => {
      if (current.includes(platform)) {
        return current.filter((item) => item !== platform);
      }

      return [...current, platform];
    });
  };

  // ==================== MEDIA ====================

  const handleMediaChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) {
      return;
    }

    setMediaFiles(Array.from(event.target.files));
  };

  const getMediaAccept = () => {
    if (contentType === "Image") {
      return "image/*";
    }

    if (contentType === "Video") {
      return "video/*";
    }

    if (contentType === "Carousel") {
      return "image/*";
    }

    if (
      contentType === "Story" ||
      contentType === "Reel"
    ) {
      return "image/*,video/*";
    }

    return "image/*,video/*";
  };

  // ==================== VALIDATION ====================

  const validatePost = () => {
    if (!content.trim()) {
      alert("Please enter post content.");
      return false;
    }

    if (platforms.length === 0) {
      alert("Please select at least one platform.");
      return false;
    }

    if (!date) {
      alert("Please select a date.");
      return false;
    }

    if (!time) {
      alert("Please select a time.");
      return false;
    }

    if (scheduleType === "recurring" && !endDate) {
      alert("Please select an end date for recurring posts.");
      return false;
    }

    if (
      scheduleType === "recurring" &&
      endDate < date
    ) {
      alert("End date must be after the start date.");
      return false;
    }

    return true;
  };

  // ==================== SCHEDULE POST ====================

  const handleSchedule = async () => {
    if (!validatePost()) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please login first.");
      window.location.href = "/";
      return;
    }

    setScheduling(true);

    try {
      /*
       * The UI uses "X", but the shared database uses
       * "Twitter-X" for the X platform.
       */
      const backendPlatforms = platforms;

      const scheduledAt = `${date}T${time}:00`;

      let mediaUrl: string | null = null;

      if (
          contentType === "Video" &&
          mediaFiles.length > 0
      ) {
        const uploadData = new FormData();

        uploadData.append(
          "file",
          mediaFiles[0]
        );

        const uploadResponse = await fetch(
          "http://127.0.0.1:8000/uploads/video",
          {
              method: "POST",
              headers: {
              Authorization: `Bearer ${token}`,
          },
          body: uploadData,
      }
  );

  const uploadResult =
    await uploadResponse.json();

  if (!uploadResponse.ok) {
    alert(
      uploadResult.detail ||
        "Video upload failed."
    );
    return;
  }

  mediaUrl = uploadResult.file_path;
}

      const requestBody = {
        content: content.trim(),
        platforms: backendPlatforms,
        scheduled_at: scheduledAt,
        status: "scheduled",
        schedule_type: scheduleType,
        recurring_frequency:
          scheduleType === "recurring"
            ? recurringFrequency
            : null,
        end_date:
          scheduleType === "recurring"
            ? endDate
            : null,
        post_type: contentType,
        media_url: mediaUrl,
        campaign_id: selectedCampaignId
          ? Number(selectedCampaignId)
          : null,
      };

      const response = await fetch(
        "http://127.0.0.1:8000/posts/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Failed to schedule the post."
        );
        return;
      }

      alert(
        `${contentType} post scheduled successfully!`
      );

      // Clear form after successful scheduling
      setContent("");
      setMediaFiles([]);
      setDate("");
      setTime("");
      setScheduleType("once");
      setRecurringFrequency("daily");
      setEndDate("");
      setSelectedCampaignId("");

    } catch (error) {
      console.error(
        "Schedule post error:",
        error
      );

      alert(
        "Unable to connect to the backend server."
      );
    } finally {
      setScheduling(false);
    }
  };

  // ==================== SAVE DRAFT ====================

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      alert("Please enter some content before saving.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please login first.");
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/posts/draft",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: content.trim(),
            post_type: contentType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Failed to save draft."
        );
        return;
      }

      alert("Draft saved successfully!");

      setContent("");
      setMediaFiles([]);

    } catch (error) {
      console.error("Save draft error:", error);

      alert(
        "Unable to connect to the backend server."
      );
    }
  };

  // ==================== PREVIEW ====================

  const handlePreview = () => {
    if (!content.trim()) {
      alert("Please enter some content to preview.");
      return;
    }

    setShowPreview(true);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">

      <div className="mx-auto max-w-6xl">

        {/* ==================== HEADER ==================== */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <a
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-800"
            >

            </a>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Create Post
            </h1>

            <p className="mt-2 text-gray-600">
              Create and schedule content across your social media platforms.
            </p>
          </div>

          <a
            href="/calendar"
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-900 hover:bg-gray-50"
          >
            View Calendar
          </a>

        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ==================== MAIN FORM ==================== */}

          <div className="lg:col-span-2 space-y-6">

            {/* ==================== CONTENT TYPE ==================== */}

            <section className="rounded-lg bg-white p-6 shadow">

              <h2 className="text-xl font-semibold text-gray-900">
                Content Type
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose the type of content you want to publish.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

                {(
                  [
                    "Text",
                    "Image",
                    "Video",
                    "Carousel",
                    "Story",
                    "Reel",
                  ] as ContentType[]
                ).map((type) => (

                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`rounded-lg border p-4 text-center font-medium transition ${
                      contentType === type
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>

                ))}

              </div>

            </section>

            {/* ==================== POST CONTENT ==================== */}

            <section className="rounded-lg bg-white p-6 shadow">

              <h2 className="text-xl font-semibold text-gray-900">
                Post Content
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Write the content you want to publish.
              </p>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="What do you want to share?"
                rows={7}
                className="mt-5 w-full rounded-lg border border-gray-300 bg-white p-4 text-gray-900 outline-none focus:border-blue-500"
              />

              <div className="mt-2 flex justify-end text-sm text-gray-500">
                {content.length} characters
              </div>

            </section>

            {/* ==================== MEDIA ==================== */}

            <section className="rounded-lg bg-white p-6 shadow">

              <h2 className="text-xl font-semibold text-gray-900">
                Media
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add images or videos when required.
              </p>

              <input
                type="file"
                accept={getMediaAccept()}
                multiple={contentType === "Carousel"}
                onChange={handleMediaChange}
                className="mt-5 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-700"
              />

              {mediaFiles.length > 0 && (
                <div className="mt-4">

                  <p className="text-sm font-semibold text-gray-700">
                    Selected files:
                  </p>

                  <ul className="mt-2 space-y-1">

                    {mediaFiles.map((file, index) => (

                      <li
                        key={`${file.name}-${index}`}
                        className="text-sm text-gray-600"
                      >
                        {file.name}
                      </li>

                    ))}

                  </ul>

                </div>
              )}

              <p className="mt-3 text-xs text-gray-400">
                Media upload to cloud storage will be connected later.
              </p>

            </section>

            {/* ==================== PLATFORMS ==================== */}

            <section className="rounded-lg bg-white p-6 shadow">

              <h2 className="text-xl font-semibold text-gray-900">
                Select Platforms
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select the connected platforms where this post should be published.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                {(
                  [
                    "Instagram",
                    "Facebook",
                    "X",
                    "LinkedIn",
                    "YouTube",
                  ] as Platform[]
                ).map((platform) => (

                  <button
                    key={platform}
                    type="button"
                    onClick={() =>
                      togglePlatform(platform)
                    }
                    className={`rounded-lg border p-4 font-medium transition ${
                      platforms.includes(platform)
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {platform}
                  </button>

                ))}

              </div>

              <p className="mt-3 text-xs text-gray-500">
                Selected:{" "}
                {platforms.length > 0
                  ? platforms.join(", ")
                  : "None"}
              </p>

            </section>

            {/* ==================== CAMPAIGN ==================== */}

            <section className="rounded-lg bg-white p-6 shadow">

              <h2 className="text-xl font-semibold text-gray-900">
                Campaign
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add this post to a campaign for content grouping and tracking.
              </p>

              <select
                value={selectedCampaignId}
                onChange={(event) =>
                  setSelectedCampaignId(event.target.value)
                }
                className="mt-5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
              >
                <option value="">
                  No Campaign
                </option>

                {campaigns.map((campaign) => (
                  <option
                    key={campaign.campaign_id}
                    value={campaign.campaign_id}
                  >
                    {campaign.campaign_name}
                    {campaign.status
                      ? ` (${campaign.status})`
                      : ""}
                  </option>
                ))}
              </select>

            </section>

            {/* ==================== SCHEDULE ==================== */}

            <section className="rounded-lg bg-white p-6 shadow">

              <h2 className="text-xl font-semibold text-gray-900">
                Schedule
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose when your post should be published.
              </p>

              {/* Schedule Type */}

              <div className="mt-5">

                <label className="block text-sm font-semibold text-gray-700">
                  Schedule Type
                </label>

                <div className="mt-3 flex gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setScheduleType("once")
                    }
                    className={`rounded-lg border px-5 py-3 font-medium ${
                      scheduleType === "once"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    One Time
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setScheduleType("recurring")
                    }
                    className={`rounded-lg border px-5 py-3 font-medium ${
                      scheduleType === "recurring"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    Recurring
                  </button>

                </div>

              </div>

              {/* Date and Time */}

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="block text-sm font-semibold text-gray-700">
                    Date
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-gray-700">
                    Time
                  </label>

                  <input
                    type="time"
                    value={time}
                    onChange={(event) =>
                      setTime(event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                  />

                </div>

              </div>

              {/* Recurring Options */}

              {scheduleType === "recurring" && (

                <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-5">

                  <h3 className="font-semibold text-gray-900">
                    Recurring Options
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div>

                      <label className="block text-sm font-semibold text-gray-700">
                        Frequency
                      </label>

                      <select
                        value={recurringFrequency}
                        onChange={(event) =>
                          setRecurringFrequency(
                            event.target.value as
                              | "daily"
                              | "weekly"
                              | "monthly"
                          )
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
                      >
                        <option value="daily">
                          Daily
                        </option>

                        <option value="weekly">
                          Weekly
                        </option>

                        <option value="monthly">
                          Monthly
                        </option>
                      </select>

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-gray-700">
                        End Date
                      </label>

                      <input
                        type="date"
                        value={endDate}
                        min={date || undefined}
                        onChange={(event) =>
                          setEndDate(event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
                      />

                    </div>

                  </div>

                </div>

              )}

            </section>

            {/* ==================== ACTIONS ==================== */}

            <section className="rounded-lg bg-white p-6 shadow">

              <div className="flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={handlePreview}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Preview
                </button>

                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={scheduling}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {scheduling
                    ? "Scheduling..."
                    : "Schedule Post"}
                </button>

              </div>

            </section>

          </div>

          {/* ==================== PREVIEW SIDEBAR ==================== */}

          <aside className="lg:col-span-1">

            <div className="sticky top-6 rounded-lg bg-white p-6 shadow">

              <h2 className="text-xl font-semibold text-gray-900">
                Post Preview
              </h2>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                    S
                  </div>

                  <div>

                    <p className="font-semibold text-gray-900">
                      SocialPilot
                    </p>

                    <p className="text-xs text-gray-500">
                      {platforms.length > 0
                        ? platforms.join(" • ")
                        : "No platform selected"}
                    </p>

                  </div>

                </div>

                <div className="mt-5 min-h-32">

                  {content ? (
                    <p className="whitespace-pre-wrap text-gray-900">
                      {content}
                    </p>
                  ) : (
                    <p className="text-gray-400">
                      Your post preview will appear here.
                    </p>
                  )}

                </div>

                {mediaFiles.length > 0 && (

                  <div className="mt-4 rounded-lg bg-gray-200 p-3">

                    <p className="text-sm font-medium text-gray-700">
                      {mediaFiles.length} media file
                      {mediaFiles.length !== 1
                        ? "s"
                        : ""}{" "}
                      selected
                    </p>

                  </div>

                )}

                <div className="mt-5 border-t border-gray-200 pt-4">

                  <p className="text-xs text-gray-500">
                    Content Type
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {contentType}
                  </p>

                </div>

                {date && time && (

                  <div className="mt-4">

                    <p className="text-xs text-gray-500">
                      Scheduled
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {date} at {time}
                    </p>

                  </div>

                )}

              </div>

            </div>

          </aside>

        </div>

        {/* ==================== PREVIEW MODAL ==================== */}

        {showPreview && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-bold text-gray-900">
                  Post Preview
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowPreview(false)
                  }
                  className="text-gray-500 hover:text-gray-900"
                >
                  ✕
                </button>

              </div>

              <div className="mt-5 rounded-lg border border-gray-200 p-5">

                <p className="text-sm font-semibold text-blue-600">
                  {contentType}
                </p>

                <p className="mt-4 whitespace-pre-wrap text-gray-900">
                  {content}
                </p>

                <div className="mt-5 text-sm text-gray-500">

                  <p>
                    Platforms:{" "}
                    {platforms.join(", ")}
                  </p>

                  <p className="mt-2">
                    Schedule:{" "}
                    {date && time
                      ? `${date} at ${time}`
                      : "Not selected"}
                  </p>

                  {scheduleType === "recurring" && (
                    <p className="mt-2">
                      Recurring:{" "}
                      {recurringFrequency} until{" "}
                      {endDate || "not selected"}
                    </p>
                  )}

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPreview(false)
                }
                className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Close Preview
              </button>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}