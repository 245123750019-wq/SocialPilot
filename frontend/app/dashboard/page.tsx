"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    fetch("http://127.0.0.1:8000/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          localStorage.removeItem("access_token");
          window.location.href = "/";
          return;
        }

        const data = await response.json();
        setUser(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600 text-lg">Loading...</p>
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

          <div>
            <h1 className="text-2xl font-bold text-indigo-600">
              SocialPilot
            </h1>
            <p className="text-xs text-slate-500">
              Social Media Management
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              window.location.href = "/";
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
          >
            Logout
          </button>

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

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">
              User ID
            </p>

            <p className="text-2xl font-bold text-slate-900 mt-2">
              {user.id}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">
              Account
            </p>

            <p className="text-lg font-semibold text-slate-900 mt-2">
              {user.email}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">
              Role
            </p>

            <p className="text-2xl font-bold text-indigo-600 mt-2">
              {user.role_id === 1 ? "Admin" : "Team Member"}
            </p>
          </div>

        </div>

        {/* Account information */}
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

            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">
                Full Name
              </p>

              <p className="font-semibold text-slate-900 mt-1">
                {user.name}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">
                Email
              </p>

              <p className="font-semibold text-slate-900 mt-1">
                {user.email}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">
                User ID
              </p>

              <p className="font-semibold text-slate-900 mt-1">
                {user.id}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">
                Account Role
              </p>

              <p className="font-semibold text-indigo-600 mt-1">
                {user.role_id === 1 ? "Administrator" : "Team Member"}
              </p>
            </div>

          </div>

        </div>

        {/* Coming soon */}
        <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">

          <h3 className="text-xl font-bold">
            Social Accounts
          </h3>

          <p className="text-indigo-100 mt-2">
            Connect and manage your Instagram, Facebook, X and other
            social media accounts from here.
          </p>

          <button
            className="mt-5 bg-white text-indigo-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            Connect Account
          </button>

        </div>

      </div>

    </main>
  );
}