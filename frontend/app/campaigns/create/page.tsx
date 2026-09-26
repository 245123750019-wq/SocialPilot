"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCampaignPage() {
  const router = useRouter();

  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!campaignName.trim()) {
      setError("Campaign name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
        const token = localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/campaigns/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaign_name: campaignName,
          description: description || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Failed to create campaign.");
      }

      router.push("/campaigns");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f6fb",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <p
            style={{
              color: "#4f46e5",
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Campaign Management
          </p>

          <h1
            style={{
              fontSize: "32px",
              color: "#172033",
              margin: 0,
            }}
          >
            Create Campaign
          </h1>

          <p
            style={{
              color: "#64748b",
              fontSize: "16px",
              marginTop: "10px",
            }}
          >
            Create a new social media campaign.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#172033",
                marginBottom: "8px",
              }}
            >
              Campaign Name
            </label>

            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Enter campaign name"
              style={{
                width: "100%",
                padding: "13px 14px",
                border: "1px solid #dbe2ea",
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#172033",
                marginBottom: "8px",
              }}
            >
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your campaign"
              rows={4}
              style={{
                width: "100%",
                padding: "13px 14px",
                border: "1px solid #dbe2ea",
                borderRadius: "8px",
                fontSize: "15px",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "22px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  color: "#172033",
                  marginBottom: "8px",
                }}
              >
                Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  border: "1px solid #dbe2ea",
                  borderRadius: "8px",
                  fontSize: "15px",
                  background: "#ffffff",
                }}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  color: "#172033",
                  marginBottom: "8px",
                }}
              >
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  border: "1px solid #dbe2ea",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#172033",
                marginBottom: "8px",
              }}
            >
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                border: "1px solid #dbe2ea",
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "12px 14px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/campaigns")}
              style={{
                padding: "13px 24px",
                borderRadius: "8px",
                border: "1px solid #dbe2ea",
                background: "#ffffff",
                color: "#475569",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "13px 24px",
                borderRadius: "8px",
                border: "none",
                background: "#4f46e5",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}