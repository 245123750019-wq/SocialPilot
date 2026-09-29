"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const menuSections = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "🏠" },
      { label: "Publishing Calendar", href: "/calendar", icon: "📅" },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { label: "Create Post", href: "/create-post", icon: "✏️" },
      { label: "Publishing Queue", href: "/publishing-queue", icon: "📋" },
      { label: "Publishing Logs", href: "/publishing-logs", icon: "📊" },
    ],
  },
  {
    title: "CAMPAIGNS",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: "📢" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Profile", href: "/profile", icon: "👤" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(true);

  const logout = () => {
    localStorage.removeItem("access_token");
    router.replace("/");
  };

  return (
    <aside
      className={`min-h-screen shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b border-slate-200 ${
          isOpen ? "p-6" : "p-4"
        }`}
      >
        <div
          className={`flex items-center ${
            isOpen ? "justify-between" : "justify-center"
          }`}
        >
          {isOpen && (
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">
                SocialPilot
              </h1>

              <p className="text-xs text-slate-500 mt-1">
                Social Media Management
              </p>
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
            title={isOpen ? "Collapse menu" : "Expand menu"}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            {/* Section title */}
            {isOpen && (
              <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400">
                {section.title}
              </p>
            )}

            {/* Section items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!isOpen ? item.label : undefined}
                    className={`flex items-center rounded-xl text-sm font-medium transition ${
                      isOpen
                        ? "gap-3 px-4 py-3"
                        : "justify-center px-2 py-3"
                    } ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>

                    {isOpen && (
                      <span>{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          title={!isOpen ? "Logout" : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition ${
            isOpen
              ? "gap-3 px-4 py-3"
              : "justify-center px-2 py-3"
          }`}
        >
          <span>🚪</span>

          {isOpen && (
            <span>Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
}
