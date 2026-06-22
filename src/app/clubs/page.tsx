"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WaterfallGrid, PostCardData } from "@/components/waterfall/PostCard";

type Club = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string | null;
  brand: string | null;
  sourcePlatform: string | null;
  avatar: string | null;
  description: string | null;
  posts: PostCardData[];
};

const CATEGORIES = [
  { key: "all", label: "全部", icon: "🏠" },
  { key: "car", label: "乘用车", icon: "🚗" },
  { key: "rv", label: "房车", icon: "🚐" },
];

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [allPosts, setAllPosts] = useState<PostCardData[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"clubs" | "posts">("posts");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (brandFilter) params.set("brand", brandFilter);
    if (activeCategory !== "all") params.set("category", activeCategory);
    fetch(`/api/clubs?${params}`)
      .then((r) => r.json())
      .then((data) => { setClubs(data || []); setLoading(false); })
      .catch(() => { setClubs([]); setLoading(false); });

    // Also fetch all posts for waterfall
    fetch(`/api/posts?take=200`)
      .then((r) => r.json())
      .then((data) => {
        const posts = (data.posts || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          images: p.images,
          videoUrl: p.videoUrl,
          sourceUrl: p.sourceUrl,
          sourcePlatform: p.sourcePlatform,
          publishedAt: p.publishedAt,
          clubId: p.club.id,
          clubName: p.club.name,
          clubBrand: p.club.brand,
          clubSlug: p.club.slug,
        }));
        setAllPosts(posts);
      })
      .catch(() => setAllPosts([]));
  }, [activeCategory, cityFilter, brandFilter]);

  const cities = [...new Set(clubs.map((c) => c.city).filter(Boolean))] as string[];
  const brands = [...new Set(clubs.map((c) => c.brand).filter(Boolean))] as string[];

  return (
    <div className="max-w-5xl mx-auto px-3">
      {/* Title */}
      <div className="pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">发现</h1>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? "bg-red-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
        {/* View toggle */}
        <div className="ml-auto shrink-0 flex bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => setView("posts")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              view === "posts" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            笔记
          </button>
          <button
            onClick={() => setView("clubs")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              view === "clubs" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            圈子
          </button>
        </div>
      </div>

      {/* Brand filter strip — only in posts view */}
      {!loading && brands.length > 0 && view === "posts" && (
        <div className="mb-3 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/?brand=${encodeURIComponent(brand)}`}
                className="shrink-0 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 hover:border-red-300 hover:text-red-500 transition whitespace-nowrap"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">暂无数据</div>
      ) : (
        <>
          {/* Posts View — Waterfall */}
          {view === "posts" && (
            <WaterfallGrid posts={allPosts} gap={10} />
          )}

          {/* Clubs View */}
          {view === "clubs" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-6">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition group"
                >
                  <div className="h-20 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center relative overflow-hidden">
                    {club.avatar ? (
                      <img src={club.avatar} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-red-200">{club.name[0]}</span>
                    )}
                    <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {club.posts.length}篇
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-sm text-gray-800 group-hover:text-red-500 truncate">
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {club.city && (
                        <span className="text-xs text-gray-400">📍{club.city}</span>
                      )}
                      {club.brand && (
                        <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                          {club.brand}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
