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
  city: string | null;
  brand: string | null;
  sourcePlatform: string | null;
  avatar: string | null;
  description: string | null;
  posts: Post[];
};

const platformLabel: Record<string, string> = {
  wechat: "微信",
  douyin: "抖音",
  xiaohongshu: "小红书",
};
const platformColor: Record<string, string> = {
  wechat: "bg-green-100 text-green-700",
  douyin: "bg-gray-100 text-gray-700",
  xiaohongshu: "bg-red-100 text-red-700",
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (brandFilter) params.set("brand", brandFilter);
    fetch(`/api/clubs?${params}`)
      .then((r) => r.json())
      .then((data) => { setClubs(data); setLoading(false); })
      .catch(() => { setClubs([]); setLoading(false); });
  }, [cityFilter, brandFilter]);

  const cities = [...new Set(clubs.map((c) => c.city).filter(Boolean))] as string[];
  const brands = [...new Set(clubs.map((c) => c.brand).filter(Boolean))] as string[];

  // Flatten all posts for the content square
  const allPosts = clubs.flatMap((club) =>
    club.posts.map((post) => ({ ...post, club }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">车友会广场</h1>
        <p className="text-gray-500 mt-1">发现全国车友会动态，找到属于你的圈子</p>
      </div>

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
                    <h3 className="font-semibold group-hover:text-blue-600">{club.name}</h3>
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

          {/* Content Square - All Posts */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">最新动态</h2>
          {allPosts.length === 0 ? (
            <p className="text-gray-400">暂无动态</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allPosts.map((post) => {
                const coverImage =
                  post.images && Array.isArray(post.images) && post.images.length > 0
                    ? post.images[0]
                    : null;
                return (
                  <Link
                    key={post.id}
                    href={`/clubs/${post.club.slug}/${post.id}`}
                    className="border rounded-xl overflow-hidden hover:shadow-md transition group"
                  >
                    {coverImage ? (
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        <img
                          src={coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-50 flex items-center justify-center text-gray-300 text-4xl">
                        📄
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">{post.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span className="text-gray-600">{post.club.name}</span>
                        {post.sourcePlatform && (
                          <span className={`px-1.5 py-0.5 rounded text-xs ${platformColor[post.sourcePlatform] || "bg-gray-100 text-gray-500"}`}>
                            {platformLabel[post.sourcePlatform] || post.sourcePlatform}
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
