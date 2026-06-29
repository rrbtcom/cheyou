"use client";

import Link from "next/link";

const tabs = [
  { key: "home", label: "首页", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/" },
  { key: "clubs", label: "发现", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", path: "/clubs" },
  { key: "used-cars", label: "二手车", icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0", path: "/used-cars" },
  { key: "ranking", label: "销量", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", path: "/ranking" },
  { key: "pk", label: "PK", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", path: "/pk" },
];

export default function BottomTabBar({ currentPath }: { currentPath: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-5xl mx-auto flex">
        {tabs.map((tab) => {
          const active = currentPath === tab.path || (tab.key === "used-cars" && currentPath?.startsWith("/used-cars"));
          return (
            <Link
              key={tab.key}
              href={tab.path}
              className={`flex-1 flex flex-col items-center py-2 pt-3 gap-0.5 text-xs transition-colors ${
                active ? "text-red-500" : "text-gray-400"
              }`}
            >
              <svg
                className={`w-5.5 h-5.5 ${active ? "text-red-500" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={active ? 2.2 : 1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
