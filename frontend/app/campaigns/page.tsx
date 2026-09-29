"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Campaign {
  campaign_id: number;
  user_id: number | null;
  campaign_name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  revenue: number;
  roi_percentage: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    const fetchCampaigns = async () => {
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
          console.error("Failed to fetch campaigns");
          return;
        }

        const data = await response.json();

        setCampaigns(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Campaigns error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">

          <div>
            <p className="text-indigo-600 font-semibold mb-1">
              Campaign Management
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Campaigns
            </h1>

            <p className="text-slate-500 mt-2">
              Create and manage your social media campaigns.
            </p>
          </div>

          <button
            onClick={() => router.push("/campaigns/create")}
            className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            + Create Campaign
          </button>

        </div>

        {/* Campaign count */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

          <p className="text-sm text-slate-500">
            Total Campaigns
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-1">
            {campaigns.length}
          </p>

        </div>

        {/* Campaign list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Your Campaigns
          </h2>

          {loading ? (
            <p className="text-slate-500">
              Loading campaigns...
            </p>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">

              <p className="text-slate-500 mb-4">
                No campaigns found.
              </p>

              <button
                onClick={() => router.push("/campaigns/create")}
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Create your first campaign
              </button>

            </div>
          ) : (
            <div className="space-y-4">

              {campaigns.map((campaign) => (

                <div
                  key={campaign.campaign_id}
                  onClick={() =>
                    router.push(`/campaigns/${campaign.campaign_id}`)
                  }
                  className="border border-slate-200 rounded-xl p-6 hover:border-indigo-300 transition cursor-pointer"
                >

                  <div className="flex items-start justify-between">

                    <div>

                      <h3 className="text-lg font-semibold text-slate-900">
                        {campaign.campaign_name}
                      </h3>

                      {campaign.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {campaign.description}
                        </p>
                      )}

                    </div>

                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
                      {campaign.status || "draft"}
                    </span>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-5">

<div>
  <p className="text-xs text-slate-500">
    Start Date
  </p>

  <p className="text-sm font-medium text-slate-900 mt-1">
    {campaign.start_date || "Not set"}
  </p>
</div>

<div>
  <p className="text-xs text-slate-500">
    End Date
  </p>

  <p className="text-sm font-medium text-slate-900 mt-1">
    {campaign.end_date || "Not set"}
  </p>
</div>

<div>
  <p className="text-xs text-slate-500">
    Budget
  </p>

  <p className="text-sm font-medium text-slate-900 mt-1">
    ₹{Number(campaign.budget || 0).toLocaleString("en-IN")}
  </p>
</div>

<div>
  <p className="text-xs text-slate-500">
    Revenue
  </p>

  <p className="text-sm font-medium text-slate-900 mt-1">
    ₹{Number(campaign.revenue || 0).toLocaleString("en-IN")}
  </p>
</div>

<div>
  <p className="text-xs text-slate-500">
    ROI
  </p>

  <p className="text-sm font-semibold text-indigo-600 mt-1">
    {Number(campaign.roi_percentage || 0).toFixed(2)}%
  </p>
</div>

</div>

                </div>

              ))}

            </div>
          )}

        </div>

      </div>

    </main>
  );
}