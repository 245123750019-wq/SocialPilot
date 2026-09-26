"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

export default function Profile() {
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
        console.error("Profile error:", error);
        setLoading(false);
      });
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

  const role = user.role_id === 1 ? "Administrator" : "Team Member";

  return (
    <main className="min-h-screen bg-slate-100">

      {/* Profile */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Back */}
        

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

          {/* Profile header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">

            <div className="flex items-center gap-5">

              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">

                <span className="text-3xl font-bold text-indigo-600">
                  {user.name.charAt(0).toUpperCase()}
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

          {/* Information */}
          <div className="p-8">

            <h3 className="text-xl font-bold text-slate-900 mb-6">
              Account Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Name */}
              <div className="bg-slate-50 rounded-xl p-5">

                <p className="text-sm text-slate-500">
                  Full Name
                </p>

                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user.name}
                </p>

              </div>

              {/* Email */}
              <div className="bg-slate-50 rounded-xl p-5">

                <p className="text-sm text-slate-500">
                  Email Address
                </p>

                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user.email}
                </p>

              </div>

              {/* User ID */}
              <div className="bg-slate-50 rounded-xl p-5">

                <p className="text-sm text-slate-500">
                  User ID
                </p>

                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user.id}
                </p>

              </div>

              {/* Role */}
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

      </div>

    </main>
  );
}