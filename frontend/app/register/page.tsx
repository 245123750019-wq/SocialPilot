"use client";

import { useState } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role_id: 2,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Registration failed");
        return;
      }

      alert("Registration successful!");

      window.location.href = "/";

    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span className="text-3xl font-bold text-indigo-600">
              S
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white">
            SocialPilot
          </h1>

          <p className="text-indigo-100 mt-2">
            Start managing your social media
          </p>

        </div>

        {/* Registration card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Create your account
            </h2>

            <p className="text-gray-500 mt-1">
              Join SocialPilot today
            </p>

          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Name */}
            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />

            </div>

            {/* Email */}
            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />

            </div>

            {/* Password */}
            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />

            </div>

            {/* Role */}
            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account type
              </label>

              <select
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none"
                value="2"
                disabled
              >
                <option value="2">
                  Team Member
                </option>
              </select>

              <p className="text-xs text-gray-400 mt-2">
                New accounts are registered as Team Members.
              </p>

            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>

          {/* Login link */}
          <div className="text-center mt-7">

            <p className="text-sm text-gray-500">
              Already have an account?{" "}

              <a
                href="/"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Sign in
              </a>

            </p>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-indigo-100 mt-6">
          © 2026 SocialPilot
        </p>

      </div>

    </main>
  );
}