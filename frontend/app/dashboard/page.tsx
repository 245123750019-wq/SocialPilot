"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface User {
  id: number;
  name: string;
  email: string;
}

interface SocialAccount {
  account_id: number;
  platform: string;
  username: string;
}

interface CampaignAnalytics {
  campaign_id: number;
  campaign_name: string;
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_reach: number;
  total_impressions: number;
  total_clicks: number;
  average_engagement_rate: number;
}
interface Campaign {
  campaign_id: number;
  campaign_name: string;
  status: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number;
  revenue?: number;
  roi_percentage?: number;
}
interface AudienceAnalytics {
  analytics_id: number;
  account_id: number;
  followers_count: number;
  follower_growth: number;
  recorded_at: string | null;
}
interface AudienceAnalyticsHistory {
  analytics_id: number;
  account_id: number;
  followers_count: number;
  follower_growth: number;
  recorded_at: string | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignAnalytics, setCampaignAnalytics] =
  useState<CampaignAnalytics | null>(null);

const [audienceAnalytics, setAudienceAnalytics] =
  useState<AudienceAnalytics | null>(null);
const [audienceHistory, setAudienceHistory] =
  useState<AudienceAnalyticsHistory[]>([]);
  interface AudienceInsight {
    insight_id: number;
    account_id: number;
    age_group: string | null;
    gender: string | null;
    location: string | null;
    active_time: string | null;
    audience_count: number;
    recorded_at: string | null;
  }
  
  const [audienceInsights, setAudienceInsights] =
    useState<AudienceInsight[]>([]);
  const engagementChartData = campaignAnalytics
  ? [
      {
        metric: "Likes",
        value: Number(campaignAnalytics.total_likes || 0),
      },
      {
        metric: "Comments",
        value: Number(campaignAnalytics.total_comments || 0),
      },
      {
        metric: "Shares",
        value: Number(campaignAnalytics.total_shares || 0),
      },
      {
        metric: "Clicks",
        value: Number(campaignAnalytics.total_clicks || 0),
      },
    ]
  : [];

const [analyticsLoading, setAnalyticsLoading] = useState(true);
const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
const [campaigns, setCampaigns] = useState<Campaign[]>([]);
const [comparisonCampaignId, setComparisonCampaignId] =
  useState<number | null>(null);

const [comparisonAnalytics, setComparisonAnalytics] =
  useState<CampaignAnalytics | null>(null);

  // Connect account form state
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [platform, setPlatform] = useState("Instagram");
  const [username, setUsername] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Fetch user and social accounts
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Get current user
        const userResponse = await fetch(
          "http://127.0.0.1:8000/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userResponse.ok) {
          localStorage.removeItem("access_token");
          window.location.href = "/";
          return;
        }

        const userData = await userResponse.json();
        setUser(userData);

        // Get connected social accounts
        const accountsResponse = await fetch(
          "http://127.0.0.1:8000/social-accounts/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!accountsResponse.ok) {
          console.error("Failed to fetch social accounts");
          return;
        }

        const accountsData = await accountsResponse.json();
        setAccounts(accountsData);
                // Get campaign analytics
                // Get the user's campaigns
                const campaignsResponse = await fetch(
                "http://127.0.0.1:8000/campaigns/",
                {
                    headers: {
                    Authorization: `Bearer ${token}`,
              },
          }
        );

        if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json();

          const campaignsDataList = Array.isArray(campaignsData)
            ? campaignsData
            : [];
          
          setCampaigns(campaignsDataList);

            // Use the first campaign belonging to the logged-in user
            if (campaignsDataList.length > 0) {
              const selectedCampaign = campaignsDataList[0];

            const campaignResponse = await fetch(
            `http://127.0.0.1:8000/analytics/campaigns/${selectedCampaign.campaign_id}`,
            {
            headers: {
            Authorization: `Bearer ${token}`,
        },
      }
    );

    if (campaignResponse.ok) {
      const campaignData = await campaignResponse.json();
      setCampaignAnalytics(campaignData);
    }
  }
}

// Get analytics for the user's connected Instagram account
const instagramAccount =
  accountsData.find(
    (account: SocialAccount) =>
      account.platform.toLowerCase() === "instagram"
  ) || accountsData[0];

  if (instagramAccount) {
    const audienceResponse = await fetch(
      `http://127.0.0.1:8000/analytics/audience/${instagramAccount.account_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  
    if (audienceResponse.ok) {
      const audienceData = await audienceResponse.json();
  
      if (Array.isArray(audienceData)) {
        setAudienceHistory(audienceData);
  
        if (audienceData.length > 0) {
          setAudienceAnalytics(
            audienceData[audienceData.length - 1]
          );
        }
      }
    }
  
    const audienceInsightsResponse = await fetch(
      `http://127.0.0.1:8000/analytics/audience-insights/${instagramAccount.account_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  
    if (audienceInsightsResponse.ok) {
      const insightsData = await audienceInsightsResponse.json();
  
      if (Array.isArray(insightsData)) {
        setAudienceInsights(insightsData);
      }
    }
  }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setAnalyticsLoading(false);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  useEffect(() => {
    const fetchSelectedCampaignAnalytics = async () => {
      if (!selectedCampaignId) {
        return;
      }
  
      const token = localStorage.getItem("access_token");
  
      if (!token) {
        return;
      }
  
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/analytics/campaigns/${selectedCampaignId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          setCampaignAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching selected campaign analytics:", error);
      }
    };
  
    fetchSelectedCampaignAnalytics();
  }, [selectedCampaignId]);
  useEffect(() => {
    const fetchComparisonAnalytics = async () => {
      if (!comparisonCampaignId) {
        setComparisonAnalytics(null);
        return;
      }
  
      const token = localStorage.getItem("access_token");
  
      if (!token) {
        return;
      }
  
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/analytics/campaigns/${comparisonCampaignId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          setComparisonAnalytics(data);
        }
      } catch (error) {
        console.error(
          "Error fetching comparison campaign analytics:",
          error
        );
      }
    };
  
    fetchComparisonAnalytics();
  }, [comparisonCampaignId]);

  // Connect social account
  const connectAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setConnecting(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/social-accounts/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            platform: platform,
            username: username,
            access_token: accessToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to connect account");
        return;
      }

      // Add new account to dashboard
      setAccounts((currentAccounts) => [
        ...currentAccounts,
        data,
      ]);

      // Clear form
      setUsername("");
      setAccessToken("");
      setPlatform("Instagram");

      // Hide form
      setShowConnectForm(false);

      alert("Social account connected successfully!");
    } catch (error) {
      console.error("Connect account error:", error);
      alert("Unable to connect to server");
    } finally {
      setConnecting(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600 text-lg">
          Loading...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100">

      {/* ==================== MAIN CONTENT ==================== */}

      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Welcome */}
        <div className="mb-8">

          <p className="text-indigo-600 font-semibold mb-1">
            Dashboard
          </p>

          <h2 className="text-3xl font-bold text-slate-900">
            Welcome, {user.name}! 👋
          </h2>

          <p className="text-slate-500 mt-2">
            Manage your social media accounts from one place.
          </p>

        </div>

        {/* ==================== MILESTONE 2 NAVIGATION ==================== */}

        <section className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Content & Publishing
            </h3>

            <p className="text-slate-500 text-sm mt-1">
              Create, schedule, monitor and manage your social media posts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Create Post */}
            <a
              href="/create-post"
              className="group rounded-xl border border-slate-200 p-5 hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <span className="text-xl">✏️</span>
              </div>

              <h4 className="font-bold text-slate-900">
                Create Post
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                Create and schedule content for your social media platforms.
              </p>

              <p className="text-sm text-indigo-600 font-semibold mt-4">
                Create →
              </p>
            </a>

            {/* Publishing Calendar */}
            <a
              href="/calendar"
              className="group rounded-xl border border-slate-200 p-5 hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <span className="text-xl">📅</span>
              </div>

              <h4 className="font-bold text-slate-900">
                Publishing Calendar
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                View and manage scheduled posts by date and time.
              </p>

              <p className="text-sm text-indigo-600 font-semibold mt-4">
                View Calendar →
              </p>
            </a>

            {/* Publishing Queue */}
            <a
              href="/publishing-queue"
              className="group rounded-xl border border-slate-200 p-5 hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <span className="text-xl">📋</span>
              </div>

              <h4 className="font-bold text-slate-900">
                Publishing Queue
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                Manage scheduled, pending, failed and published posts.
              </p>

              <p className="text-sm text-indigo-600 font-semibold mt-4">
                View Queue →
              </p>
            </a>

            {/* Publishing Logs */}
            <a
              href="/publishing-logs"
              className="group rounded-xl border border-slate-200 p-5 hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <span className="text-xl">📊</span>
              </div>

              <h4 className="font-bold text-slate-900">
                Publishing Logs
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                Track publishing activity and publishing results.
              </p>

              <p className="text-sm text-indigo-600 font-semibold mt-4">
                View Logs →
              </p>
            </a>

          </div>
        </section>

        {/* ==================== SUMMARY CARDS ==================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* User ID */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">

            <p className="text-sm text-slate-500">
              User ID
            </p>

            <p className="text-2xl font-bold text-slate-900 mt-2">
              {user.id}
            </p>

          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">

            <p className="text-sm text-slate-500">
              Account
            </p>

            <p className="text-lg font-semibold text-slate-900 mt-2">
              {user.email}
            </p>

          </div>

        </div>

        {/* ==================== ACCOUNT INFORMATION ==================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h3 className="text-xl font-bold text-slate-900">
                Account Information
              </h3>

              <p className="text-slate-500 text-sm mt-1">
                Your SocialPilot account details
              </p>

            </div>

            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">

              <span className="text-indigo-600 font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Full Name */}
            <div className="bg-slate-50 rounded-xl p-4">

              <p className="text-sm text-slate-500">
                Full Name
              </p>

              <p className="font-semibold text-slate-900 mt-1">
                {user.name}
              </p>

            </div>

            {/* Email */}
            <div className="bg-slate-50 rounded-xl p-4">

              <p className="text-sm text-slate-500">
                Email
              </p>

              <p className="font-semibold text-slate-900 mt-1">
                {user.email}
              </p>

            </div>

            {/* User ID */}
            <div className="bg-slate-50 rounded-xl p-4">

              <p className="text-sm text-slate-500">
                User ID
              </p>

              <p className="font-semibold text-slate-900 mt-1">
                {user.id}
              </p>

            </div>

          </div>

        </div>

        {/* ==================== SOCIAL ACCOUNTS ==================== */}

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">

            <div>

              <h3 className="text-xl font-bold text-slate-900">
                Social Accounts
              </h3>

              <p className="text-slate-500 text-sm mt-1">
                Your connected social media accounts.
              </p>

            </div>

            <button
              onClick={() => setShowConnectForm(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              + Connect Account
            </button>

          </div>

          {/* Connect Form */}
          {showConnectForm && (
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-6">

              <h4 className="text-lg font-bold text-slate-900 mb-4">
                Connect Social Account
              </h4>

              <form
                onSubmit={connectAccount}
                className="space-y-4"
              >

                {/* Platform */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Platform
                  </label>

                  <select
                    value={platform}
                    onChange={(e) =>
                      setPlatform(e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="Instagram">
                      Instagram
                    </option>

                    <option value="Facebook">
                      Facebook
                    </option>

                    <option value="X">
                      X
                    </option>

                    <option value="LinkedIn">
                      LinkedIn
                    </option>
                  </select>

                </div>

                {/* Username */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Username
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    placeholder="@my_test_account"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-indigo-500"
                    required
                  />

                </div>

                {/* Access Token */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Access Token
                  </label>

                  <input
                    type="text"
                    value={accessToken}
                    onChange={(e) =>
                      setAccessToken(e.target.value)
                    }
                    placeholder="test-token-123"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-indigo-500"
                    required
                  />

                  <p className="text-xs text-slate-400 mt-2">
                    Use a test token for now. Real OAuth
                    integration will be added later.
                  </p>

                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setShowConnectForm(false)
                    }
                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-white transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={connecting}
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {connecting
                      ? "Connecting..."
                      : "Connect Account"}
                  </button>

                </div>

              </form>

            </div>
          )}

          {/* Accounts List */}
          {accounts.length === 0 ? (

            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">

              <div className="text-4xl mb-3">
                📱
              </div>

              <h4 className="font-semibold text-slate-900">
                No social accounts connected
              </h4>

              <p className="text-sm text-slate-500 mt-1">
                Connect a social media account to get started.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {accounts.map((account) => (

                <div
                  key={account.account_id}
                  className="flex items-center justify-between border border-slate-200 rounded-xl p-5"
                >

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">

                      <span className="text-indigo-600 font-bold">
                        {account.platform
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                    </div>

                    <div>

                      <p className="font-semibold text-slate-900">
                        {account.username}
                      </p>

                      <p className="text-sm text-slate-500">
                        {account.platform}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>
      {/* Analytics Dashboard */}
      <div className="mt-8 space-y-8">

        {/* Campaign Analytics */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Campaign Analytics
            </h2>
            <div className="mt-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Campaign
              </label>

              <select
                  value={selectedCampaignId ?? ""}
                  onChange={(event) =>
                  setSelectedCampaignId(
                  event.target.value ? Number(event.target.value) : null
                    )
                  } 
                  className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                <option value="">Select a campaign</option>

                {campaigns.map((campaign) => (
                  <option
                  key={campaign.campaign_id}
                  value={campaign.campaign_id}
                >
                  {campaign.campaign_name}
                </option>
                ))}
              </select>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Compare With
                </label>

                <select
                    value={comparisonCampaignId ?? ""}
                    onChange={(event) =>
                      setComparisonCampaignId(
                        event.target.value ? Number(event.target.value) : null
                      )
                    }
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                    <option value="">Select comparison campaign</option>

                    {campaigns
                      .filter(
                        (campaign) =>
                          campaign.campaign_id !== selectedCampaignId
                      )
                      .map((campaign) => (
                        <option
                          key={campaign.campaign_id}
                          value={campaign.campaign_id}
                        >
                          {campaign.campaign_name}
                        </option>
                      ))}
                  </select>
                </div>
</div>

            <p className="text-slate-500 mt-1">
              Track campaign performance and engagement metrics.
            </p>
          </div>

          {analyticsLoading ? (
            <p className="text-slate-500">
              Loading campaign analytics...
            </p>
          ) : campaignAnalytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500">Total Posts</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {campaignAnalytics.total_posts}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500">Likes</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {campaignAnalytics.total_likes}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500">Comments</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {campaignAnalytics.total_comments}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500">Shares</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {campaignAnalytics.total_shares}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500">Reach</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {campaignAnalytics.total_reach}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500">Impressions</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {campaignAnalytics.total_impressions}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500">Clicks</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {campaignAnalytics.total_clicks}
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-xl p-5">
                  <p className="text-sm text-indigo-600">
                    Engagement Rate
                  </p>

                  <p className="text-2xl font-bold text-indigo-700 mt-1">
                    {campaignAnalytics.average_engagement_rate.toFixed(2)}%
                  </p>
                </div>

              </div>

              <div className="mt-6 p-5 border border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500">
                  Campaign
                </p>

                <p className="font-semibold text-slate-900 mt-1">
                  {campaignAnalytics.campaign_name}
                </p>
              </div>
            </>
          ) : (
            <p className="text-slate-500">
              No campaign analytics available.
            </p>
          )}

        </div>
        {/* Interactive Engagement Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
        <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Engagement Metrics
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Interactive campaign engagement performance
        </p>
        </div>

        <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={engagementChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="metric" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" />
        </BarChart>
        </ResponsiveContainer>
        </div>
        </div>
        {/* Audience Growth Trend */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">
        Audience Growth Trend
        </h3>
        <p className="text-sm text-slate-500 mt-1">
        Follower growth over time
        </p>
      </div>

  <div className="w-full h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={audienceHistory.map((item) => ({
          date: item.recorded_at
            ? new Date(item.recorded_at).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                }
              )
            : "Unknown",
          followers: item.followers_count,
        }))}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="followers"
          strokeWidth={3}
          dot
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
        {/* Campaign Comparison */}
{comparisonAnalytics && campaignAnalytics && (
  <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">
        Campaign Comparison
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Compare performance between two campaigns
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* First Campaign */}
      <div className="rounded-xl bg-indigo-50 p-5">
        <h3 className="font-semibold text-indigo-900">
          {campaigns.find(
            (campaign) =>
              campaign.campaign_id === selectedCampaignId
          )?.campaign_name || "Campaign 1"}
        </h3>

        <div className="mt-4 space-y-3 text-sm">
          <p>
            <span className="text-slate-500">Likes:</span>{" "}
            <span className="font-semibold">
              {campaignAnalytics.total_likes}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Comments:</span>{" "}
            <span className="font-semibold">
              {campaignAnalytics.total_comments}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Shares:</span>{" "}
            <span className="font-semibold">
              {campaignAnalytics.total_shares}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Reach:</span>{" "}
            <span className="font-semibold">
              {campaignAnalytics.total_reach}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Impressions:</span>{" "}
            <span className="font-semibold">
              {campaignAnalytics.total_impressions}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Clicks:</span>{" "}
            <span className="font-semibold">
              {campaignAnalytics.total_clicks}
            </span>
          </p>

          <p>
            <span className="text-slate-500">
              Engagement Rate:
            </span>{" "}
            <span className="font-semibold">
              {campaignAnalytics.average_engagement_rate.toFixed(2)}%
            </span>
          </p>
        </div>
      </div>

      {/* Comparison Campaign */}
      <div className="rounded-xl bg-slate-50 p-5">
        <h3 className="font-semibold text-slate-900">
          {campaigns.find(
            (campaign) =>
              campaign.campaign_id === comparisonCampaignId
          )?.campaign_name || "Campaign 2"}
        </h3>

        <div className="mt-4 space-y-3 text-sm">
          <p>
            <span className="text-slate-500">Likes:</span>{" "}
            <span className="font-semibold">
              {comparisonAnalytics.total_likes}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Comments:</span>{" "}
            <span className="font-semibold">
              {comparisonAnalytics.total_comments}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Shares:</span>{" "}
            <span className="font-semibold">
              {comparisonAnalytics.total_shares}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Reach:</span>{" "}
            <span className="font-semibold">
              {comparisonAnalytics.total_reach}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Impressions:</span>{" "}
            <span className="font-semibold">
              {comparisonAnalytics.total_impressions}
            </span>
          </p>

          <p>
            <span className="text-slate-500">Clicks:</span>{" "}
            <span className="font-semibold">
              {comparisonAnalytics.total_clicks}
            </span>
          </p>

          <p>
            <span className="text-slate-500">
              Engagement Rate:
            </span>{" "}
            <span className="font-semibold">
              {comparisonAnalytics.average_engagement_rate.toFixed(2)}%
            </span>
          </p>
        </div>
      </div>

    </div>
  </div>
)}
{/* ROI Tracking */}
{campaignAnalytics && (
  <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">
        ROI Tracking
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Track campaign budget, revenue, and return on investment
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Budget */}
      <div className="rounded-xl bg-slate-50 p-5">
        <p className="text-sm text-slate-500">
          Campaign Budget
        </p>

        <p className="text-2xl font-bold text-slate-900 mt-2">
          ₹
          {Number(
            campaigns.find(
              (campaign) =>
                campaign.campaign_id === selectedCampaignId
            )?.budget || 0
          ).toLocaleString("en-IN")}
        </p>
      </div>

      {/* Revenue */}
      <div className="rounded-xl bg-slate-50 p-5">
        <p className="text-sm text-slate-500">
          Campaign Revenue
        </p>

        <p className="text-2xl font-bold text-slate-900 mt-2">
          ₹
          {Number(
            campaigns.find(
              (campaign) =>
                campaign.campaign_id === selectedCampaignId
            )?.revenue || 0
          ).toLocaleString("en-IN")}
        </p>
      </div>

      {/* ROI */}
      <div className="rounded-xl bg-indigo-50 p-5">
        <p className="text-sm text-indigo-600">
          ROI
        </p>

        <p className="text-3xl font-bold text-indigo-900 mt-2">
          {Number(
            campaigns.find(
              (campaign) =>
                campaign.campaign_id === selectedCampaignId
            )?.roi_percentage || 0
          ).toFixed(2)}
          %
        </p>
      </div>

    </div>
  </div>
)}
{/* Advanced Audience Insights */}
{audienceInsights.length > 0 && (
  <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900">
        Advanced Audience Insights
      </h2>

      <p className="text-slate-500 mt-1">
        Audience demographics, location, and active-time insights.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Demographics */}
      <div className="rounded-xl bg-indigo-50 p-5">
        <p className="text-sm text-indigo-600">
          Audience Demographics
        </p>

        <p className="text-lg font-semibold text-indigo-900 mt-2">
          {audienceInsights[0].age_group || "Not available"}
        </p>

        <p className="text-sm text-slate-600 mt-1">
          Gender: {audienceInsights[0].gender || "Not available"}
        </p>

        <p className="text-sm text-slate-600 mt-1">
          Audience:{" "}
          {audienceInsights[0].audience_count.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Location */}
      <div className="rounded-xl bg-slate-50 p-5">
        <p className="text-sm text-slate-500">
          Top Location
        </p>

        <p className="text-lg font-semibold text-slate-900 mt-2">
          {audienceInsights[0].location || "Not available"}
        </p>

        <p className="text-sm text-slate-600 mt-1">
          Audience:{" "}
          {audienceInsights[0].audience_count.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Active Time */}
      <div className="rounded-xl bg-slate-50 p-5">
        <p className="text-sm text-slate-500">
          Peak Active Time
        </p>

        <p className="text-lg font-semibold text-slate-900 mt-2">
          {audienceInsights[0].active_time || "Not available"}
        </p>

        <p className="text-sm text-slate-600 mt-1">
          Best time to engage with this audience
        </p>
      </div>

    </div>
  </div>
)}

        {/* Audience Growth & Performance Report */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Audience Growth & Performance
            </h2>

            <p className="text-slate-500 mt-1">
              Monitor follower growth and audience performance for your connected account.
            </p>
          </div>

          {analyticsLoading ? (
            <p className="text-slate-500">
              Loading audience analytics...
            </p>
          ) : audienceAnalytics ? (
            <>
              {/* Audience Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-slate-50 rounded-xl p-6">
                  <p className="text-sm text-slate-500">
                    Total Followers
                  </p>

                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {audienceAnalytics.followers_count}
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-xl p-6">
                  <p className="text-sm text-indigo-600">
                    Follower Growth
                  </p>

                  <p className="text-3xl font-bold text-indigo-700 mt-1">
                    {audienceAnalytics.follower_growth >= 0 ? "+" : ""}
                    {audienceAnalytics.follower_growth}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-6">
                  <p className="text-sm text-slate-500">
                    Analytics Record
                  </p>

                  <p className="text-lg font-semibold text-slate-900 mt-2">
                    {audienceAnalytics.recorded_at
                      ? new Date(
                          audienceAnalytics.recorded_at
                        ).toLocaleDateString()
                      : "Not recorded"}
                  </p>
                </div>

              </div>

              {/* Connected Account */}
              <div className="mt-6 border border-slate-200 rounded-xl p-5">

                <p className="text-sm text-slate-500">
                  Connected Account
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">

                  <p className="font-semibold text-slate-900">
                    {accounts.find(
                      (account) =>
                        account.account_id ===
                        audienceAnalytics.account_id
                    )?.username || "Connected Account"}
                  </p>

                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
                    {accounts.find(
                      (account) =>
                        account.account_id ===
                        audienceAnalytics.account_id
                    )?.platform || "Social Platform"}
                  </span>

                </div>

              </div>

              {/* Performance Summary */}
              <div className="mt-6 bg-slate-50 rounded-xl p-5">

                <h3 className="font-semibold text-slate-900">
                  Audience Performance
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Current audience size:
                  <span className="font-semibold text-slate-700">
                    {" "}{audienceAnalytics.followers_count}
                  </span>
                  {" "}followers.
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Recorded follower change:
                  <span className="font-semibold text-slate-700">
                    {" "}
                    {audienceAnalytics.follower_growth >= 0 ? "+" : ""}
                    {audienceAnalytics.follower_growth}
                  </span>
                  {" "}followers.
                </p>

              </div>

            </>
          ) : (
            <p className="text-slate-500">
              No audience analytics available.
            </p>
          )}

        </div>

        </div>

      

    </main>
  );
}