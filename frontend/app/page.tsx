"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginRole, setLoginRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("access_token", data.access_token);

      const meResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      if (!meResponse.ok) {
          alert("Unable to load user information");
          return;
      }

      const user = await meResponse.json();

      if (user.role !== loginRole) {
        alert(
          `This account is registered as ${user.role === "admin" ? "Admin" : "User"}. Please select the correct account type.`
        );
        return;
      }

      localStorage.setItem("user_role", user.role);
      localStorage.setItem("user_id", String(user.id));
      localStorage.setItem("user_name", user.name);


      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-md">

        {/* Logo / Brand */}
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
            Manage all your social media in one place
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back
            </h2>

            <p className="text-gray-500 mt-1">
              Sign in to continue to your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
            {/* Account type */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Login as
  </label>

  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setLoginRole("user")}
      className={`py-3 rounded-xl border font-medium transition ${
        loginRole === "user"
          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
      }`}
    >
      User
    </button>

    <button
      type="button"
      onClick={() => setLoginRole("admin")}
      className={`py-3 rounded-xl border font-medium transition ${
        loginRole === "admin"
          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
      }`}
    >
      Admin
    </button>
  </div>
</div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">
              SocialPilot
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Social media management made simple.
          </p>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-indigo-100 mt-6">
          © 2026 SocialPilot
        </p>

      </div>
    </main>
  );
}
