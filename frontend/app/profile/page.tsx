"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface SocialAccount {
  account_id: number;
  platform: string;
  username: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [youtubeAccount, setYoutubeAccount] =
    useState<SocialAccount | null>(null);

  const [disconnecting, setDisconnecting] =
    useState(false);

  const connectYouTube = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/social-accounts/youtube/connect",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
          "Unable to connect YouTube."
        );
        return;
      }

      if (data.authorization_url) {
        window.location.href =
          data.authorization_url;
      } else {
        alert(
          "YouTube authorization URL was not returned."
        );
      }
    } catch (error) {
      console.error(
        "YouTube connection error:",
        error
      );

      alert("Unable to connect YouTube.");
    }
  };

  const disconnectYouTube = async () => {
    if (!youtubeAccount) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to disconnect your YouTube account?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem(
      "access_token"
    );

    if (!token) {
      window.location.href = "/";
      return;
    }

    setDisconnecting(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/social-accounts/${youtubeAccount.account_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
          "Unable to disconnect YouTube."
        );
        return;
      }

      setYoutubeAccount(null);

      alert(
        "YouTube account disconnected successfully."
      );
    } catch (error) {
      console.error(
        "YouTube disconnect error:",
        error
      );

      alert(
        "Unable to disconnect YouTube."
      );
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(
      "access_token"
    );

    if (!token) {
      window.location.href = "/";
      return;
    }

    const loadProfile = async () => {
      try {
        const userResponse = await fetch(
          "http://127.0.0.1:8000/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userResponse.ok) {
          localStorage.removeItem(
            "access_token"
          );

          window.location.href = "/";
          return;
        }

        const userData =
          await userResponse.json();

        setUser(userData);

        const accountsResponse =
          await fetch(
            "http://127.0.0.1:8000/social-accounts/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (accountsResponse.ok) {
          const accountsData =
            await accountsResponse.json();

          const youtube =
            accountsData.find(
              (account: SocialAccount) =>
                account.platform.toLowerCase() ===
                "youtube"
            );

          if (youtube) {
            setYoutubeAccount(youtube);
          }
        }
      } catch (error) {
        console.error(
          "Profile error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600 text-lg">
          Loading profile...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const role =
    user.role === "admin"
      ? "Administrator"
      : "User";

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">

          <p className="text-indigo-600 font-semibold mb-1">
            My Profile
          </p>

          <h2 className="text-3xl font-bold text-slate-900">
            Profile Settings
          </h2>

          <p className="text-slate-500 mt-2">
            View your SocialPilot account information.
          </p>

        </div>

        {/* Profile Card */}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">

            <div className="flex items-center gap-5">

              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">

                <span className="text-3xl font-bold text-indigo-600">
                  {user.name
                    .charAt(0)
                    .toUpperCase()}
                </span>

              </div>

              <div className="text-white">

                <h3 className="text-2xl font-bold">
                  {user.name}
                </h3>

                <p className="text-indigo-100 mt-1">
                  {user.email}
                </p>

              </div>

            </div>

          </div>

          <div className="p-8">

            <h3 className="text-xl font-bold text-slate-900 mb-6">
              Account Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="bg-slate-50 rounded-xl p-5">

                <p className="text-sm text-slate-500">
                  Full Name
                </p>

                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user.name}
                </p>

              </div>

              <div className="bg-slate-50 rounded-xl p-5">

                <p className="text-sm text-slate-500">
                  Email Address
                </p>

                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user.email}
                </p>

              </div>

              <div className="bg-slate-50 rounded-xl p-5">

                <p className="text-sm text-slate-500">
                  User ID
                </p>

                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user.id}
                </p>

              </div>

              <div className="bg-slate-50 rounded-xl p-5">

                <p className="text-sm text-slate-500">
                  Account Role
                </p>

                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                  {role}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* Social Accounts */}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 p-8">

          <h3 className="text-xl font-bold text-slate-900">
            Social Accounts
          </h3>

          <p className="text-slate-500 mt-2">
            Connect your social media accounts to publish content.
          </p>

          <div className="mt-6 flex items-center justify-between bg-slate-50 rounded-xl p-5">

            <div>

              <p className="font-semibold text-slate-900">
                YouTube
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Connect your YouTube channel for video publishing.
              </p>

            </div>

            {youtubeAccount ? (

              <div className="flex flex-col items-end gap-2">

                <span className="px-5 py-2.5 rounded-lg bg-green-100 text-green-700 font-semibold">
                  ✓ Connected
                </span>

                <p className="text-sm text-slate-500">
                  {youtubeAccount.username}
                </p>

                <button
                  type="button"
                  onClick={disconnectYouTube}
                  disabled={disconnecting}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disconnecting
                    ? "Disconnecting..."
                    : "Disconnect"}
                </button>

              </div>

            ) : (

              <button
                type="button"
                onClick={connectYouTube}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Connect YouTube
              </button>

            )}

          </div>

        </div>

      </div>

    </main>
  );
}