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
import NotificationBell from "../components/NotificationBell";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at?: string;
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "campaigns" | "engagement" | "audience" | "roi" | "admin"
>("overview");
  const [campaignAnalytics, setCampaignAnalytics] =
  useState<CampaignAnalytics | null>(null);
  const [selectedEngagementPlatform, setSelectedEngagementPlatform] =
  useState<"all" | "instagram" | "facebook">("all");
  const [publishedPostMetrics, setPublishedPostMetrics] = useState<
  {
    post_id: number;
    platform: string;
    metrics: {
      likes: number | null;
      comments: number | null;
      shares: number | null;
      reach: number | null;
      views: number | null;
      saved: number | null;
      error: string | null;
    };
  }[]
>([]);

const [audienceAnalytics, setAudienceAnalytics] =
  useState<AudienceAnalytics | null>(null);
const [audienceHistory, setAudienceHistory] =
  useState<AudienceAnalyticsHistory[]>([]);
const [audienceHistories, setAudienceHistories] = useState<
  Record<number, AudienceAnalyticsHistory[]>
>({});

const [selectedAudienceAccountId, setSelectedAudienceAccountId] =
  useState<number | null>(null);
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
const [analyticsLoading, setAnalyticsLoading] = useState(true);
const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
const [campaigns, setCampaigns] = useState<Campaign[]>([]);
const [comparisonCampaignId, setComparisonCampaignId] =
  useState<number | null>(null);

const [comparisonAnalytics, setComparisonAnalytics] =

  useState<CampaignAnalytics | null>(null);

  const engagementChartData = (() => {
    const validPosts = publishedPostMetrics.filter(
      (post) =>
        !post.metrics.error &&
        ["instagram", "facebook"].includes(post.platform.toLowerCase()) &&
        (selectedEngagementPlatform === "all" ||
          post.platform.toLowerCase() === selectedEngagementPlatform)
    );

    const sumMetric = (
      metric: "likes" | "comments" | "shares" | "reach" | "saved"
    ) => {
      const values = validPosts
        .map((post) => post.metrics[metric])
        .filter((value): value is number => value !== null);

      return values.length
        ? values.reduce((total, value) => total + value, 0)
        : null;
    };

    return [
      { metric: "Likes", value: sumMetric("likes") },
      { metric: "Comments", value: sumMetric("comments") },
      { metric: "Shares", value: sumMetric("shares") },
      { metric: "Reach", value: sumMetric("reach") },
      { metric: "Saves", value: sumMetric("saved") },
    ];
  })();


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
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
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
          `${process.env.NEXT_PUBLIC_API_URL}/social-accounts/`,
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
        console.log("Social accounts API response:", accountsData);

        const updatedAccounts = accountsData.map((account: SocialAccount) =>
          account.account_id === 27
            ? { ...account, username: "My Facebook Page" }
            : account
        );

        setAccounts(updatedAccounts);
        // Load live metrics for published posts
const publishedPostsResponse = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/analytics/published-posts`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }
);

if (publishedPostsResponse.ok) {
  const publishedPostsData = await publishedPostsResponse.json();

  if (Array.isArray(publishedPostsData)) {
    setPublishedPostMetrics(publishedPostsData);
  }
}
                // Get campaign analytics
                // Get the user's campaigns
                const campaignsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/campaigns/`,
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
              setSelectedCampaignId(selectedCampaign.campaign_id);

              const campaignResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/analytics/campaigns/${selectedCampaign.campaign_id}`,
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


// Load audience analytics for supported connected platforms
const supportedPlatforms = ["instagram", "facebook", "youtube"];

const audienceAccounts = accountsData.filter(
  (account: SocialAccount) =>
    supportedPlatforms.includes(account.platform.toLowerCase()) &&
    (
      !/demo|test/i.test(account.username) ||
      account.account_id === 27
    )
);

const histories: Record<number, AudienceAnalyticsHistory[]> = {};

for (const account of audienceAccounts) {
  const accountId = account.account_id;

  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/analytics/audience/${accountId}/refresh`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const historyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/analytics/audience/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (historyResponse.ok) {
      const historyData = await historyResponse.json();

      if (Array.isArray(historyData)) {
        histories[accountId] = historyData;
      }
    }
  } catch (error) {
    console.error(
      `Failed to load audience history for account ${accountId}:`,
      error
    );
  }
}
console.log("Loaded audience histories:", histories);
console.log("Facebook history:", histories[27]);
setAudienceHistories(histories);

const firstAccountWithHistory = audienceAccounts.find(
  (account: SocialAccount) =>
    (histories[account.account_id] ?? []).length > 0
);

setSelectedAudienceAccountId(
  firstAccountWithHistory?.account_id ?? null
);

const selectedHistory = firstAccountWithHistory
  ? histories[firstAccountWithHistory.account_id] ?? []
  : [];

setAudienceHistory(selectedHistory);

if (selectedHistory.length > 0) {
  setAudienceAnalytics(selectedHistory[selectedHistory.length - 1]);
}

// Keep the existing Instagram audience insights behavior
const instagramAccount = audienceAccounts.find(
  (account: SocialAccount) =>
    account.platform.toLowerCase() === "instagram"
);

if (instagramAccount) {
  const audienceInsightsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/analytics/audience-insights/${instagramAccount.account_id}`,
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

  // ---------------- ADMIN USER MANAGEMENT ----------------

  const fetchAllUsers = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    setAdminUsersLoading(true);
    setAdminUsersError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setAdminUsersError(
            "You do not have permission to manage users."
          );
        } else {
          setAdminUsersError(
            "Failed to load users."
          );
        }

        return;
      }

      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);

      setAdminUsersError(
        "Unable to connect to server."
      );
    } finally {
      setAdminUsersLoading(false);
    }
  };
  const updateUserStatus = async (
    userId: number,
    isActive: boolean
  ) => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users/${userId}/status?is_active=${isActive}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        alert(
          errorData.detail ||
          "Failed to update user status."
        );

        return;
      }

      setAllUsers((currentUsers) =>
        currentUsers.map((managedUser) =>
          managedUser.id === userId
            ? {
                ...managedUser,
                is_active: isActive
              }
            : managedUser
        )
      );

    } catch (error) {
      console.error(
        "Error updating user status:",
        error
      );

      alert("Unable to connect to server.");
    }
  };

  useEffect(() => {
    if (user?.role === "admin" && activeTab === "admin") {
      fetchAllUsers();
    }
  }, [user, activeTab]);

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
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/campaigns/${selectedCampaignId}`,
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
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/campaigns/${comparisonCampaignId}`,
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
        `${process.env.NEXT_PUBLIC_API_URL}/social-accounts/`,
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

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 min-w-0">


{/* Welcome and top-right notifications */}
<div className="mb-8 flex items-start justify-between gap-4">
  <div className="min-w-0">
    <p className="text-indigo-600 font-semibold mb-1">
      Dashboard
    </p>

    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
      Welcome, {user.name}! 👋
    </h2>

    <p className="text-sm text-indigo-600 font-medium mt-2">
      Account type: {user.role === "admin" ? "Administrator" : "User"}
    </p>

    <p className="text-slate-500 mt-2">
      Manage your social media accounts from one place.
    </p>
  </div>

  <div className="shrink-0">
    <NotificationBell />
  </div>
</div>

        {/* ==================== DASHBOARD TABS ==================== */}

        <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-2 w-full overflow-hidden">
          <div className="flex flex-wrap gap-2">

  {[
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "campaigns", label: "Campaigns", icon: "📢" },
  { id: "engagement", label: "Engagement", icon: "💬" },
  { id: "audience", label: "Audience", icon: "👥" },
  { id: "roi", label: "ROI", icon: "💰" },
  ...(user.role === "admin"
    ? [{ id: "admin", label: "User Management", icon: "⚙️" }]
    : []),
].map((tab) => (
      <button
        key={tab.id}
        onClick={() =>
          setActiveTab(
            tab.id as
              | "overview"
              | "campaigns"
              | "engagement"
              | "audience"
              | "roi"
              | "admin"
          )
        }
        className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
          activeTab === tab.id
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
      >
        <span>{tab.icon}</span>
        <span>{tab.label}</span>
      </button>
    ))}

  </div>
</div>

        {/* ==================== MILESTONE 2 NAVIGATION ==================== */}
        {/* ==================== SUMMARY CARDS ==================== */}
        {/* ==================== ACCOUNT INFORMATION ==================== */}
        {/* ==================== SOCIAL ACCOUNTS ==================== */}
      {/* Analytics Dashboard */}
<div className="mt-8 space-y-8">

{/* ==================== OVERVIEW TAB ==================== */}

{activeTab === "overview" && (
  <div className="space-y-8">


    {/* Key Metrics */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">


{/* Engagement */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
  <p className="text-sm font-medium text-slate-500">Engagement</p>

  <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
    {["likes", "comments", "shares"].reduce((total, metric) => {
      const values = publishedPostMetrics
        .filter(
          (post) =>
            !post.metrics.error &&
            ["instagram", "facebook"].includes(post.platform.toLowerCase()) &&
            (selectedEngagementPlatform === "all" ||
              post.platform.toLowerCase() === selectedEngagementPlatform)
        )
        .map(
          (post) =>
            post.metrics[metric as "likes" | "comments" | "shares"]
        )
        .filter((value): value is number => value !== null);

      return total + values.reduce((sum, value) => sum + value, 0);
    }, 0)}
  </p>

  <p className="text-xs text-slate-400 mt-2">
    Likes + comments + shares on published posts
  </p>
</div>



{/* Reach */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
  <p className="text-sm font-medium text-slate-500">Reach</p>

  <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
    {(() => {
      const values = publishedPostMetrics
        .filter(
          (post) =>
            !post.metrics.error &&
            ["instagram", "facebook"].includes(post.platform.toLowerCase()) &&
            (selectedEngagementPlatform === "all" ||
              post.platform.toLowerCase() === selectedEngagementPlatform)
        )
        .map((post) => post.metrics.reach)
        .filter((value): value is number => value !== null);

      return values.length
        ? values.reduce((sum, value) => sum + value, 0)
        : "—";
    })()}
  </p>

  <p className="text-xs text-slate-400 mt-2">
    Sum of reported post reach
  </p>
</div>


{/* Views */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
  <p className="text-sm font-medium text-slate-500">Views</p>
  <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
    {(() => {
      const values = publishedPostMetrics
        .filter(
          (post) =>
            post.platform.toLowerCase() === "instagram" &&
            !post.metrics.error &&
            typeof post.metrics.views === "number"
        )
        .map((post) => post.metrics.views as number);

      return values.length
        ? values.reduce((sum, value) => sum + value, 0)
        : "—";
    })()}
  </p>
  <p className="text-xs text-slate-400 mt-2">
    Sum of reported Instagram post views
  </p>
</div>

      {/* Clicks */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <p className="text-sm font-medium text-slate-500">Clicks</p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">—</p>
        <p className="text-xs text-slate-400 mt-2">
          Post link-click metrics are not currently fetched
        </p>
        </div>

{/* Published Posts */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
  <p className="text-sm font-medium text-slate-500">Published Posts</p>

  <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
    {publishedPostMetrics.filter((post) => !post.metrics.error).length}
  </p>

  <p className="text-xs text-slate-400 mt-2">
    Published posts with fetched metrics
  </p>
</div>

{/* Connected Social Accounts */}
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
  <p className="text-sm font-medium text-slate-500">
    Connected Social Accounts
  </p>

  <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
    {
      accounts.filter(
        (account) =>
          (!/demo/i.test(account.username) || account.account_id === 27)
      ).length
    }
  </p>

  <p className="text-xs text-slate-400 mt-2">
    {[
      ...new Set(
        accounts
          .filter(
            (account) =>
              (!/demo/i.test(account.username) || account.account_id === 27)
          )
          .map((account) => account.platform)
      ),
    ].join(" · ")} accounts
  </p>
</div>
</div></div>
  )}

{/* Campaigns Tab */}
{activeTab === "campaigns" && (
                <>
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
      </>
    )}
        {activeTab === "engagement" && (
        <>
        {/* Interactive Engagement Chart */}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
        <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Engagement Metrics
        </h2>
        <div className="mt-5">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Select platform
  </label>

  <select
    value={selectedEngagementPlatform}
    onChange={(event) =>
      setSelectedEngagementPlatform(
        event.target.value as "all" | "instagram" | "facebook"
      )
    }
    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
  >
    <option value="all">All platforms</option>
    <option value="instagram">Instagram</option>
    <option value="facebook">Facebook</option>
  </select>
</div>
        <p className="text-sm text-slate-500 mt-1">
          Interactive campaign engagement performance
        </p>
        </div>

        <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart
  data={engagementChartData.map((item) => {
    const metricKey = {
      Likes: "likes",
      Comments: "comments",
      Shares: "shares",
      Reach: "reach",
      Saves: "saved",
    } as const;

    const key = metricKey[item.metric as keyof typeof metricKey];

    const total = publishedPostMetrics
      .filter(
        (post) =>
          !post.metrics.error &&
          ["instagram", "facebook"].includes(post.platform.toLowerCase()) &&
          (selectedEngagementPlatform === "all" ||
            post.platform.toLowerCase() === selectedEngagementPlatform)
      )
      .map((post) => post.metrics[key])
      .filter((value): value is number => value !== null)
      .reduce((sum, value) => sum + value, 0);

    return { ...item, value: total };
  })}
>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="metric" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar
          dataKey="value"
          fill="#4f46e5"
          radius={[6, 6, 0, 0]}
        />
        </BarChart>
        </ResponsiveContainer>
        </div>
        </div>
        </>
        )}
        {activeTab === "audience" && (
        <>
        {/* Audience Growth Trend */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">
        Audience Growth Trend
        </h3>
          <p className="text-sm text-slate-500 mt-1">
            Follower growth over time
          </p>

          <div className="mb-5 max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select social account
              </label>

            <select
              value={selectedAudienceAccountId ?? ""}
              onChange={(event) => {
              const accountId = event.target.value
                  ? Number(event.target.value)
                  : null;

              setSelectedAudienceAccountId(accountId);

              const history = accountId
                ? audienceHistories[accountId] ?? []
                : [];

              setAudienceHistory(history);
              setAudienceAnalytics(
              history.length > 0 ? history[history.length - 1] : null
              );
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          >
            <option value="">Select an account</option>

            {accounts
              .filter((account) =>
                ["instagram", "facebook", "youtube"].includes(
                  account.platform.toLowerCase()
                ) &&
                !/demo|test/i.test(account.username) ||
                account.account_id === 27
              )
              .map((account) => (
                <option key={account.account_id} value={account.account_id}>
                  {account.platform} — {account.username}
                </option>
              ))}
</select>
        </div>


{/* Current Audience Count */}
<div className="mb-5 rounded-xl bg-indigo-50 border border-indigo-100 p-5">
  <p className="text-sm font-medium text-indigo-700">
    Current {
      accounts.find(
        (account) =>
          account.account_id === selectedAudienceAccountId
      )?.platform.toLowerCase() === "youtube"
        ? "Subscribers"
        : "Followers"
    }
  </p>

  <p className="mt-1 text-3xl font-bold text-indigo-900">
    {selectedAudienceAccountId !== null &&
    audienceHistories[selectedAudienceAccountId]?.length
      ? audienceHistories[selectedAudienceAccountId][
          audienceHistories[selectedAudienceAccountId].length - 1
        ].followers_count
      : "—"}
  </p>


  {(() => {
  const history =
    selectedAudienceAccountId !== null
      ? audienceHistories[selectedAudienceAccountId] ?? []
      : [];

  const latest = history[history.length - 1];
  const previous = history[history.length - 2];

  const change =
    latest && previous
      ? latest.followers_count - previous.followers_count
      : null;

  const growthPercentage =
    latest && previous && previous.followers_count > 0
      ? (change! / previous.followers_count) * 100
      : null;

  return (
    <>
      <p className="mt-2 text-sm font-medium text-slate-700">
        Change from previous snapshot:{" "}
        {change === null
          ? "Not enough history yet"
          : change > 0
            ? `+${change}`
            : change}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        Growth percentage:{" "}
        {growthPercentage === null
          ? "Not available"
          : `${growthPercentage > 0 ? "+" : ""}${growthPercentage.toFixed(2)}%`}
      </p>
    </>
  );
})()}


  <p className="mt-1 text-sm text-slate-500">
    {
      accounts.find(
        (account) =>
          account.account_id === selectedAudienceAccountId
      )?.platform ?? "Select a platform"
    } audience
  </p>
</div>


      </div>

  <div className="w-full h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart


        data={audienceHistory
          .filter((item, index, history) =>
            index === 0 ||
            item.followers_count !== history[index - 1].followers_count
          )
          .map((item) => ({
            date: item.recorded_at
              ? new Date(item.recorded_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
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
</>
)}
      {activeTab === "campaigns" && (
      <>
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
  </>
)}
{/* ROI Tracking */}
{activeTab === "roi" && (
  <>
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
    </>
  )}
{activeTab === "audience" && (
  <>
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
</>
)}
        {activeTab === "audience" && (
        <>

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

</>
)}

</div>
{activeTab === "admin" && user.role === "admin" && (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900">
        User Management
      </h2>

      <p className="text-slate-500 mt-1">
        Manage registered users and their account roles.
      </p>
    </div>

    {adminUsersLoading ? (
      <p className="text-slate-500">
        Loading users...
      </p>
    ) : adminUsersError ? (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-600">
          {adminUsersError}
        </p>
      </div>
    ) : allUsers.length === 0 ? (
      <p className="text-slate-500">
        No users found.
      </p>
    ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
            <p className="text-sm text-slate-500">
                Total Users
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {allUsers.length}
            </p>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
        <p className="text-sm text-slate-500">
          Normal Users
        </p>

        <p className="text-3xl font-bold text-slate-900 mt-2">
          {
            allUsers.filter(
              (managedUser) => managedUser.role === "user"
            ).length
          }
        </p>
      </div>

      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5">
        <p className="text-sm text-indigo-600">
          Administrators
        </p>

        <p className="text-3xl font-bold text-indigo-700 mt-2">
          {
            allUsers.filter(
              (managedUser) => managedUser.role === "admin"
            ).length
          }
    </p>
  </div>

</div>
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-bold text-slate-900">
        Recent Users
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        Recently registered accounts.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[...allUsers]
      .sort((a, b) => {
        const dateA = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const dateB = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return dateB - dateA;
      })
      .slice(0, 5)
      .map((recentUser) => (
        <div
          key={recentUser.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
        >
          <div>
            <p className="font-semibold text-slate-900">
              {recentUser.name}
            </p>

            <p className="text-sm text-slate-500 mt-1">
              {recentUser.email}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              recentUser.role === "admin"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {recentUser.role === "admin"
              ? "Admin"
              : "User"}
          </span>
        </div>
      ))}
  </div>
</div>
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-slate-200 text-left">

        <th className="px-4 py-3 font-semibold text-slate-600">
          Name
        </th>

        <th className="px-4 py-3 font-semibold text-slate-600">
          Email
        </th>

        <th className="px-4 py-3 font-semibold text-slate-600">
          Role
        </th>

        <th className="px-4 py-3 font-semibold text-slate-600">
          Registered
        </th>

        <th className="px-4 py-3 font-semibold text-slate-600">
          Status
        </th>

        <th className="px-4 py-3 font-semibold text-slate-600">
          Actions
        </th>

      </tr>
    </thead>

    <tbody>
      {allUsers.map((managedUser) => (
        <tr
          key={managedUser.id}
          className="border-b border-slate-100"
        >

          {/* Name */}
          <td className="px-4 py-4 font-medium text-slate-900">
            {managedUser.name}
          </td>

          {/* Email */}
          <td className="px-4 py-4 text-slate-600">
            {managedUser.email}
          </td>

          {/* Role */}
          <td className="px-4 py-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                managedUser.role === "admin"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {managedUser.role === "admin"
                ? "Admin"
                : "User"}
            </span>
          </td>

          {/* Registered */}
          <td className="px-4 py-4 text-slate-600">
            {managedUser.created_at
              ? new Date(
                  managedUser.created_at
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )
              : "—"}
          </td>

          {/* Status */}
          <td className="px-4 py-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                managedUser.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {managedUser.is_active
                ? "Active"
                : "Inactive"}
            </span>
          </td>

          {/* Actions */}
          <td className="px-4 py-4">
            {managedUser.id === user.id ? (
              <span className="text-xs text-slate-400">
                Current account
              </span>
            ) : (
              <div className="flex flex-wrap gap-2">

                {/* Activate / Deactivate */}
                <button
                  type="button"
                  onClick={() => {
                    const action = managedUser.is_active
                      ? "deactivate"
                      : "activate";

                    const confirmed = window.confirm(
                      `Are you sure you want to ${action} ${managedUser.name}'s account?`
                    );

                    if (!confirmed) {
                      return;
                    }

                    updateUserStatus(
                      managedUser.id,
                      !managedUser.is_active
                    );
                  }}
                  className={`px-3 py-2 rounded-lg text-white text-xs font-semibold ${
                    managedUser.is_active
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {managedUser.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>

                {/* Change Role */}
                <button
                  type="button"
                  onClick={async () => {
                    const newRole =
                      managedUser.role === "admin"
                        ? "user"
                        : "admin";

                    const confirmed = window.confirm(
                      `Change ${managedUser.name}'s role to ${newRole}?`
                    );

                    if (!confirmed) {
                      return;
                    }

                    const token =
                      localStorage.getItem(
                        "access_token"
                      );

                    if (!token) {
                      window.location.href = "/";
                      return;
                    }

                    try {
                      const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/auth/users/${managedUser.id}/role?role=${newRole}`,
                        {
                          method: "PUT",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      const data =
                        await response.json();

                      if (!response.ok) {
                        alert(
                          data.detail ||
                            "Failed to update user role"
                        );
                        return;
                      }

                      alert(
                        "User role updated successfully!"
                      );

                      fetchAllUsers();
                    } catch (error) {
                      console.error(
                        "Role update error:",
                        error
                      );

                      alert(
                        "Unable to connect to server"
                      );
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Change Role
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      `Are you sure you want to delete ${managedUser.name}?`
                    );

                    if (!confirmed) {
                      return;
                    }

                    const token =
                      localStorage.getItem(
                        "access_token"
                      );

                    if (!token) {
                      window.location.href = "/";
                      return;
                    }

                    try {
                      const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/auth/users/${managedUser.id}`,
                        {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      const data =
                        await response.json();

                      if (!response.ok) {
                        alert(
                          data.detail ||
                            "Failed to delete user"
                        );
                        return;
                      }

                      alert(
                        "User deleted successfully!"
                      );

                      fetchAllUsers();
                    } catch (error) {
                      console.error(
                        "Delete user error:",
                        error
                      );

                      alert(
                        "Unable to connect to server"
                      );
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                >
                  Delete
                </button>

              </div>
            )}
          </td>

        </tr>
      ))}
    </tbody>
  </table>
</div>
      </>
    )}

  </div>
)}
</div>

</main>
);
}