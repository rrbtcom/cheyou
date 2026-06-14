"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  content: string | null;
  images: string[] | null;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  publishedAt: string | null;
};

type Club = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  avatar: string | null;
  description: string | null;
  _count: { posts: number };
  posts: Post[];
};

export default function BrandDetailPage() {
  const params = useParams();
  const brand = decodeURIComponent(params.slug as string);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clubs?brand=${encodeURIComponent(brand)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setClubs(data || []); setLoading(false); })
      .catch(() => { setClubs([]); setLoading(false); });
  }, [brand]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-400">加载中...</div>
  );

  if (clubs.length === 0) return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-400">暂无「{brand}」相关车友会</div>
  );

  const totalPosts = clubs.reduce((sum, c) => sum + c._count.posts, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {brand[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{brand} 车友会</h1>
            <p className="text-blue-100 mt-1">
              {clubs.length} 个车友俱乐部 · {totalPosts} 篇精选文章
            </p>
          </div>
        </div>
      </div>

      {/* Club List */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">全部车友俱乐部</h2>
      <div className="space-y-4">
        {clubs.map((club) => (
          <Link
            key={club.id}
            href={`/clubs/${club.slug}`}
            className="block bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-start gap-4">
              {club.avatar ? (
                <img src={club.avatar} alt={club.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0">
                  {club.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">{club.name}</h3>
                  {club.city && (
                    <span className="text-xs text-gray-400">📍 {club.city}</span>
                  )}
                  {club.description && (
                    <span className="text-xs text-gray-400">· {club.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span>📝 {club._count.posts} 篇文章</span>
                  {club.posts[0] && (
                    <span className="text-gray-300">|</span>
                  )}
                  {club.posts[0] && (
                    <span className="truncate max-w-xs">最新：{club.posts[0].title}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            {club.posts.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {club.posts.slice(0, 3).map((post) => (
                  <span key={post.id} className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full truncate max-w-40">
                    {post.title}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
