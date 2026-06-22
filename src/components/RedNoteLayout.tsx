"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomTabBar from "./BottomTabBar";

export default function RedNoteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide tab bar on admin pages
  const showTabBar = !pathname.startsWith("/admin") && !pathname.startsWith("/auth");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Search Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-3">
          <Link href="/" className="shrink-0">
            <div>
              <div className="text-lg font-bold text-red-500 tracking-tight leading-none">车友荟</div>
              <div className="text-[9px] text-gray-400 leading-none mt-0.5">车友荟聚的地方</div>
            </div>
          </Link>
          <Link
            href="/search"
            className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-200 transition"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>搜索车型、品牌、俱乐部...</span>
          </Link>
        </div>
      </header>

      {/* Page Content */}
      <main className={showTabBar ? "pb-20" : ""}>
        {children}
      </main>

      {/* Bottom Tab Bar */}
      {showTabBar && <BottomTabBar currentPath={pathname} />}
    </div>
  );
}
