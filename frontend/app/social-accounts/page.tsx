
"use client";

import { useCallback, useEffect, useState } from "react";

interface SocialAccount {
  account_id: number;
  platform: string;
  username: string;
}

const platforms = [
  {
    name: "Instagram",
    description: "Connect your Instagram account for image publishing.",
    endpoint: "instagram",
  },
  {
    name: "Facebook",
    description: "Connect your Facebook Page for social media publishing.",
    endpoint: "facebook",
  },
  {
    name: "X",
    description: "Connect your X account for social media publishing.",
    endpoint: "x",
  },
  {
    name: "YouTube",
    description: "Connect your YouTube channel for video publishing.",
    endpoint: "youtube",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
    null
  );
  const [disconnectingAccountId, setDisconnectingAccountId] = useState<
    number | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAccounts = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/social-accounts/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load social accounts.");
      }

      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Social accounts error:", error);
      setErrorMessage("Unable to load social accounts. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");

    if (connected) {
      setSuccessMessage(
        `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully.`
      );
      window.history.replaceState({}, "", window.location.pathname);
    }

    loadAccounts();
  }, [loadAccounts]);

  const connectPlatform = async (platformName: string, endpoint: string) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setConnectingPlatform(platformName);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/social-accounts/${endpoint}/connect`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Unable to connect ${platformName}.`);
      }

      if (!data.authorization_url) {
        throw new Error("Authorization URL was not returned by the backend.");
      }

      window.location.href = data.authorization_url;
    } catch (error) {
      console.error(`${platformName} connection error:`, error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Unable to connect ${platformName}.`
      );
      setConnectingPlatform(null);
    }
  };

  const disconnectAccount = async (account: SocialAccount) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    const confirmed = window.confirm(
      `Disconnect ${account.username} from ${account.platform} in SocialPilot?`
    );

    if (!confirmed) return;

    setDisconnectingAccountId(account.account_id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/social-accounts/${account.account_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to disconnect account.");
      }

      setSuccessMessage(`${account.platform} disconnected from SocialPilot.`);
      await loadAccounts();
    } catch (error) {
      console.error("Disconnect error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to disconnect account."
      );
    } finally {
      setDisconnectingAccountId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600 text-lg">Loading social accounts...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-indigo-600 font-semibold mb-1">
            Account Management
          </p>
          <h2 className="text-3xl font-bold text-slate-900">
            Social Accounts
          </h2>
          <p className="text-slate-500 mt-2">
            Manage your connected social media accounts in one place.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="space-y-5">
            {platforms.map((platform) => {
              const matchingAccounts = accounts.filter(
                (item) =>
                  item.platform.toLowerCase() === platform.name.toLowerCase()
              );

              // Prefer the accounts previously selected for display,
              // but allow newly connected accounts as a fallback.
              const account =
                (platform.name === "Instagram"
                  ? matchingAccounts.find(
                      (item) => item.username === "__bhavanii__1"
                    )
                  : platform.name === "Facebook"
                    ? matchingAccounts.find((item) => item.account_id === 27)
                    : undefined) || matchingAccounts[0];

              const isConnecting = connectingPlatform === platform.name;
              const isDisconnecting =
                account !== undefined &&
                disconnectingAccountId === account.account_id;

              return (
                <div
                  key={platform.name}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 rounded-xl border border-slate-100 p-5"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {platform.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-2">
                    {account ? (
                      <>
                        <span className="px-5 py-2 rounded-lg bg-green-100 text-green-700 font-semibold">
                          ✓ Connected
                        </span>

                        <p className="text-sm text-slate-500">
                          {account.username}
                        </p>

                        <button
                          type="button"
                          onClick={() => disconnectAccount(account)}
                          disabled={
                            disconnectingAccountId !== null ||
                            connectingPlatform !== null
                          }
                          className="px-5 py-2 rounded-lg border border-red-200 text-red-700 font-semibold hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {isDisconnecting
                            ? "Disconnecting..."
                            : "Disconnect"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          connectPlatform(platform.name, platform.endpoint)
                        }
                        disabled={
                          connectingPlatform !== null ||
                          disconnectingAccountId !== null
                        }
                        className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {isConnecting
                          ? "Connecting..."
                          : `Connect ${platform.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
