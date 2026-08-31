"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

interface SocialAccount {
  id: number;
  platform: string;
  account_name: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect account form state
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [platform, setPlatform] = useState("Instagram");
  const [accountName, setAccountName] = useState("");
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
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
            account_name: accountName,
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
      setAccountName("");
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

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">

          {/* Logo */}
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">
              SocialPilot
            </h1>

            <p className="text-xs text-slate-500">
              Social Media Management
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">

            {/* Profile */}
            <button
              onClick={() => {
                window.location.href = "/profile";
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            >
              Profile
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              Logout
            </button>

          </div>
        </div>
      </nav>

      {/* Main content */}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

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

          {/* Role */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">

            <p className="text-sm text-slate-500">
              Role
            </p>

            <p className="text-2xl font-bold text-indigo-600 mt-2">
              {user.role_id === 1
                ? "Admin"
                : "Team Member"}
            </p>

          </div>

        </div>

        {/* Account Information */}
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

            {/* Account Role */}
            <div className="bg-slate-50 rounded-xl p-4">

              <p className="text-sm text-slate-500">
                Account Role
              </p>

              <p className="font-semibold text-indigo-600 mt-1">
                {user.role_id === 1
                  ? "Administrator"
                  : "Team Member"}
              </p>

            </div>

          </div>

        </div>

        {/* Social Accounts */}
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

                {/* Account Name */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Account Name
                  </label>

                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) =>
                      setAccountName(e.target.value)
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
                  key={account.id}
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
                        {account.account_name}
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

    </main>
  );
}