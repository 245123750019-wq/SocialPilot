"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Campaign {
  campaign_id: number;
  user_id: number | null;
  campaign_name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Summary {
  total_posts: number;
  scheduled_posts: number;
  published_posts: number;
  failed_posts: number;
  cancelled_posts: number;
}

interface Analytics {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_reach: number;
  total_impressions: number;
  total_clicks: number;
  average_engagement_rate: number;
}

interface CampaignReport {
  total_posts: number;
  status_breakdown: Record<string, number>;
  platform_breakdown: Record<string, number>;
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const campaignId = params.campaign_id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [report, setReport] = useState<CampaignReport | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCampaignData = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const campaignResponse = await fetch(
          `http://127.0.0.1:8000/campaigns/${campaignId}`,
          { headers }
        );

        if (!campaignResponse.ok) {
          throw new Error("Failed to load campaign.");
        }

        const campaignData = await campaignResponse.json();
        setCampaign(campaignData);

        const summaryResponse = await fetch(
          `http://127.0.0.1:8000/campaigns/${campaignId}/summary`,
          { headers }
        );

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        }

        const reportResponse = await fetch(
          `http://127.0.0.1:8000/campaigns/${campaignId}/report`,
          { headers }
        );

        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          setReport(reportData);
        }

        const analyticsResponse = await fetch(
          `http://127.0.0.1:8000/analytics/campaigns/${campaignId}`,
          { headers }
        );

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load campaign."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [campaignId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600 text-lg">
          Loading campaign...
        </p>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-red-600 mb-4">
            {error || "Campaign not found."}
          </p>

          <button
            onClick={() => router.push("/campaigns")}
            className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
          >
            Back to Campaigns
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/campaigns")}
              className="text-indigo-600 font-medium mb-4 hover:underline"
            >
              ← Back to Campaigns
            </button>

            <p className="text-indigo-600 font-semibold mb-1">
              Campaign Management
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              {campaign.campaign_name}
            </h1>

            <p className="text-slate-500 mt-2">
              {campaign.description || "No campaign description available."}
            </p>
          </div>

          <span className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-semibold capitalize">
            {campaign.status || "draft"}
          </span>
        </div>

        {/* Campaign Information */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Campaign Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <p className="text-sm text-slate-500">
                Start Date
              </p>
              <p className="font-semibold text-slate-900 mt-1">
                {campaign.start_date || "Not set"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                End Date
              </p>
              <p className="font-semibold text-slate-900 mt-1">
                {campaign.end_date || "Not set"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Campaign ID
              </p>
              <p className="font-semibold text-slate-900 mt-1">
                #{campaign.campaign_id}
              </p>
            </div>

          </div>
        </section>

        {/* Tracking */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Campaign Tracking
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Total Posts
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {summary?.total_posts ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Scheduled
              </p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {summary?.scheduled_posts ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Published
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {summary?.published_posts ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Failed
              </p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {summary?.failed_posts ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Cancelled
              </p>
              <p className="text-3xl font-bold text-slate-600 mt-2">
                {summary?.cancelled_posts ?? 0}
              </p>
            </div>

          </div>
        </section>

        {/* Analytics */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Campaign Analytics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Likes
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {analytics?.total_likes ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Comments
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {analytics?.total_comments ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Shares
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {analytics?.total_shares ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Engagement Rate
              </p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {(analytics?.average_engagement_rate ?? 0).toFixed(2)}%
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Reach
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {analytics?.total_reach ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Impressions
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {analytics?.total_impressions ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Clicks
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {analytics?.total_clicks ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Analytics Posts
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {analytics?.total_posts ?? 0}
              </p>
            </div>

          </div>
        </section>

        {/* Campaign Report */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Campaign Report
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Report Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">
                Reported Posts
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-2">
                {report?.total_posts ?? 0}
              </p>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Status Breakdown
              </h3>

              {report &&
              Object.keys(report.status_breakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(report.status_breakdown).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-slate-500 capitalize">
                          {status}
                        </span>

                        <span className="font-semibold text-slate-900">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No status data available.
                </p>
              )}
            </div>

            {/* Platform Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Platform Breakdown
              </h3>

              {report &&
              Object.keys(report.platform_breakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(report.platform_breakdown).map(
                    ([platform, count]) => (
                      <div
                        key={platform}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-slate-500">
                          {platform}
                        </span>

                        <span className="font-semibold text-slate-900">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No platform data available.
                </p>
              )}
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
