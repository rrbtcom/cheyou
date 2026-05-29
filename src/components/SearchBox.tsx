"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox({ defaultValue = "", size = "md" }: { defaultValue?: string; size?: "sm" | "md" | "lg" }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const sizeClasses = {
    sm: "h-9 text-sm",
    md: "h-11 text-base",
    lg: "h-14 text-lg",
  };

  const btnClasses = {
    sm: "px-3 text-sm",
    md: "px-5 text-sm",
    lg: "px-6 text-base",
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索车型、资讯、二手车..."
        className={`flex-1 border border-r-0 border-gray-300 rounded-l-lg px-4 focus:outline-none focus:border-blue-500 ${sizeClasses[size]}`}
      />
      <button
        type="submit"
        className={`bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition whitespace-nowrap ${btnClasses[size]}`}
      >
        搜索
      </button>
    </form>
  );
}
