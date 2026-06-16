"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  content: string | null;
  images: string[] | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  publishedAt: string | null;
};

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
  posts: Post[];
};

const CATEGORIES = [
  { key: "all", label: "全部", icon: "🌐" },
  { key: "car", label: "乘用车", icon: "🚗" },
  
  { key: "rv", label: "房车", icon: "🚐" },
];

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (brandFilter) params.set("brand", brandFilter);
    if (activeCategory !== "all") params.set("category", activeCategory);
    fetch(`/api/clubs?${params}`)
      .then((r) => r.json())
      .then((data) => { setClubs(data); setLoading(false); })
      .catch(() => { setClubs([]); setLoading(false); });
  }, [cityFilter, brandFilter, activeCategory]);

  const cities = [...new Set(clubs.map((c) => c.city).filter(Boolean))] as string[];
  const brands = [...new Set(clubs.map((c) => c.brand).filter(Boolean))] as string[];

  const allPosts = clubs.flatMap((club) =>
    club.posts.map((post) => ({ ...post, club }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">车友会广场</h1>
        <p className="text-gray-500 mt-1">精选车友文章，发现真实用车体验</p>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 rounded-t-lg whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              {cat.key !== "all" && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === cat.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {cat.key === "truck" ? "0" : cat.key === "rv" ? "10" : clubs.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Navigation Strip (only for car category) */}
      {!loading && activeCategory === "car" && brands.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">🏷️ 按品牌浏览</p>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/brands/${encodeURIComponent(brand)}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all"
              >
                <span>🚗</span>
                <span>{brand}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Category-specific description */}
      {activeCategory === "truck" && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
        </div>
      )}
      {activeCategory === "rv" && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
          <p className="text-sm text-purple-800">🚐 房车频道收录长城房车、上汽大通、宇通、金冠等房车品牌车友社区内容</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部城市</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部品牌</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">加载中...</p>
      ) : clubs.length === 0 ? (
        <p className="text-gray-400">暂无车友会数据</p>
      ) : (
        <>
          {/* Club Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.slug}`}
                className="border rounded-xl p-5 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-3 mb-3">
                  {club.avatar ? (
                    <img src={club.avatar} alt={club.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {club.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold group-hover:text-blue-600">{club.name}</h3>
                      {club.category === "truck" && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">🚛</span>}
                      {club.category === "rv" && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">🚐</span>}
                    </div>
                    <div className="text-xs text-gray-400 flex gap-2">
                      {club.city && <span>📍{club.city}</span>}
                      {club.brand && <span>🚗{club.brand}</span>}
                    </div>
                  </div>
                </div>
                {club.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{club.description}</p>
                )}
              </Link>
            ))}
          </div>

          {/* Content Square */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">精选文章</h2>
          {allPosts.length === 0 ? (
            <p className="text-gray-400">暂无动态</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {allPosts.map((post) => {
                const coverImage =
                  post.images && Array.isArray(post.images) && post.images.length > 0
                    ? post.images[0]
                    : null;
                const catEmoji = post.club.category === "truck" ? "🚛" : post.club.category === "rv" ? "🚐" : "🚗";
                return (
                  <Link
                    key={post.id}
                    href={`/clubs/${post.club.slug}/${post.id}`}
                    className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group"
                  >
                    {coverImage ? (
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        <img
                          src={coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                        <span className="text-3xl">{catEmoji}</span>
                      </div>
                    )}
                    <div className="p-2.5">
                      <h3 className="font-medium text-xs leading-snug line-clamp-2 group-hover:text-blue-600 mb-2">{post.title}</h3>
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/brands/${encodeURIComponent(post.club.brand || "")}`}
                          className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[100px] hover:bg-blue-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.club.brand}
                        </Link>
                        {post.publishedAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(post.publishedAt).toLocaleDateString("zh-CN", {month:"short",day:"numeric"})}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
