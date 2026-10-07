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
      className={`min-h-screen shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 w-16 ${
        isOpen ? "md:w-64" : "md:w-20"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b border-slate-200 ${
          isOpen ? "md:p-6" : "md:p-4"
        } p-3`}
      >
        <div
          className={`flex items-center ${
            isOpen ? "md:justify-between" : "md:justify-center"
          } justify-center`}
        >
          {/* Desktop Logo */}
          <div className="hidden md:block">
            {isOpen ? (
              <div>
                <h1 className="text-2xl font-bold text-indigo-600">
                  SocialPilot
                </h1>

                <p className="text-xs text-slate-500 mt-1">
                  Social Media Management
                </p>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-indigo-600">
                S
              </h1>
            )}
          </div>

          {/* Mobile Logo */}
          <div className="md:hidden">
            <h1 className="text-xl font-bold text-indigo-600">
              S
            </h1>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex w-10 h-10 rounded-lg items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
            title={isOpen ? "Collapse menu" : "Expand menu"}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 md:px-4 py-4 md:py-5 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-4 md:mb-6">
            {/* Section title */}
            {isOpen && (
              <p className="hidden md:block px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400">
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
                    title={item.label}
                    className={`flex items-center justify-center md:justify-start rounded-xl text-sm font-medium transition ${
                      isOpen
                        ? "md:gap-3 md:px-4"
                        : "md:justify-center md:px-2"
                      } px-1 py-3 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                    }`}
                  >
                    <span className="text-base shrink-0">
                      {item.icon}
                    </span>

                    {isOpen && (
                      <span className="hidden md:inline">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 md:p-4 border-t border-slate-200">
        <button
          onClick={logout}
          title="Logout"
          className={`w-full flex items-center justify-center md:justify-start rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition ${
            isOpen
              ? "md:gap-3 md:px-4"
              : "md:justify-center md:px-2"
          } px-2 py-3`}
        >
          <span>🚪</span>

          {isOpen && (
            <span className="hidden md:inline">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
